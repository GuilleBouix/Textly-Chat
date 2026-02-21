import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import { Mensaje, Sala, UsuarioSupabase } from "../types/database";

type PerfilChat = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

export function useChat() {
  const [usuario, setUsuario] = useState<UsuarioSupabase | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [idSalaActiva, setIdSalaActiva] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [perfiles, setPerfiles] = useState<Record<string, PerfilChat>>({});
  const [errorSalaEliminada, setErrorSalaEliminada] = useState<string | null>(null);
  const cachePerfilesRef = useRef<Record<string, { perfil: PerfilChat; fetchedAt: number }>>({});
  const inFlightPerfilesRef = useRef<Set<string>>(new Set());
  const PERFIL_TTL_MS = 5 * 60 * 1000;

  const generarCodigoSala = () =>
    Math.floor(10000000 + Math.random() * 90000000).toString();

  const crearPerfilDesdeUsuario = (user: any): PerfilChat => ({
    id: user.id,
    email: user.email ?? undefined,
    nombre:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "Usuario",
    avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
  });

  const agregarPerfiles = (lista: PerfilChat[]) => {
    if (!lista.length) return;

    const now = Date.now();
    lista.forEach((p) => {
      if (!p?.id) return;
      cachePerfilesRef.current[p.id] = { perfil: p, fetchedAt: now };
    });

    setPerfiles((prev) => {
      const next = { ...prev };
      lista.forEach((p) => {
        if (!p?.id) return;
        next[p.id] = p;
      });
      return next;
    });
  };

  const cargarPerfilesPorIds = async (ids: string[]) => {
    const now = Date.now();
    const idsUnicos = [...new Set(ids.filter(Boolean))];
    if (!idsUnicos.length) return;

    const faltantes = idsUnicos.filter((id) => {
      if (inFlightPerfilesRef.current.has(id)) return false;
      const cached = cachePerfilesRef.current[id];
      if (!cached) return true;
      return now - cached.fetchedAt > PERFIL_TTL_MS;
    });
    if (!faltantes.length) return;

    faltantes.forEach((id) => inFlightPerfilesRef.current.add(id));

    try {
      const res = await fetch("/api/users/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: faltantes }),
      });

      if (!res.ok) return;

      const data = await res.json();
      if (Array.isArray(data?.users)) {
        agregarPerfiles(data.users as PerfilChat[]);
      }
    } catch (error) {
      console.error("No se pudieron cargar perfiles de la sala:", error);
    } finally {
      faltantes.forEach((id) => inFlightPerfilesRef.current.delete(id));
    }
  };

  const validarSalaActiva = async () => {
    if (!idSalaActiva) return null;

    const { data, error } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", idSalaActiva)
      .maybeSingle();

    if (error || !data) {
      setErrorSalaEliminada("Este chat fue eliminado.");
      setIdSalaActiva(null);
      setMensajes([]);
      setSalas((prev) => prev.filter((s) => s.id !== idSalaActiva));
      return null;
    }

    return data;
  };

  useEffect(() => {
    const inicializar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUsuario(user as UsuarioSupabase);
      agregarPerfiles([crearPerfilDesdeUsuario(user)]);

      const { data } = await supabase
        .from("rooms")
        .select("*")
        .or(`creator_id.eq.${user.id},participant_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (data) setSalas(data);
    };

    inicializar();
  }, []);

  useEffect(() => {
    if (!idSalaActiva) return;

    setErrorSalaEliminada(null);

    const cargarMensajes = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", idSalaActiva)
        .order("created_at", { ascending: true });

      if (data) {
        setMensajes(data);
        const senderIds = data.map((m) => m.sender_id);
        await cargarPerfilesPorIds(senderIds);
      }

      const { data: salaActual } = await supabase
        .from("rooms")
        .select("creator_id, participant_id")
        .eq("id", idSalaActiva)
        .maybeSingle();

      if (salaActual) {
        await cargarPerfilesPorIds(
          [salaActual.creator_id, salaActual.participant_id].filter(Boolean) as string[],
        );
      }
    };

    cargarMensajes();

    const canalMensajes = supabase
      .channel(`sala-${idSalaActiva}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${idSalaActiva}`,
        },
        (payload) => {
          const msg = payload.new as Mensaje;
          setMensajes((prev) => [...prev, msg]);
          void cargarPerfilesPorIds([msg.sender_id]);
        },
      )
      .subscribe();

    const canalSalaEliminada = supabase
      .channel(`room-delete-${idSalaActiva}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${idSalaActiva}`,
        },
        () => {
          setErrorSalaEliminada("Este chat fue eliminado.");
          setIdSalaActiva(null);
          setMensajes([]);
          setSalas((prev) => prev.filter((s) => s.id !== idSalaActiva));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalMensajes);
      supabase.removeChannel(canalSalaEliminada);
    };
  }, [idSalaActiva]);

  const crearSala = async () => {
    if (!usuario) {
      console.error("No hay usuario autenticado para crear sala.");
      return;
    }

    const nuevoCodigo = generarCodigoSala();

    const { data, error } = await supabase
      .from("rooms")
      .insert([
        {
          creator_id: usuario.id,
          share_code: nuevoCodigo,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error al crear sala:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      alert("No se pudo crear la sala. Intentalo otra vez.");
      return;
    }

    if (data) {
      setSalas([data, ...salas]);
      setIdSalaActiva(data.id);
    }
  };

  const unirseASala = async (codigo: string) => {
    if (!usuario || !codigo) return { error: "Faltan datos" };

    const { data: sala } = await supabase
      .from("rooms")
      .select("*")
      .eq("share_code", codigo.trim().toUpperCase())
      .single();

    if (!sala) return { error: "La sala no existe." };
    if (sala.creator_id === usuario.id)
      return { error: "Ya eres el creador de esta sala." };

    const { error: errorUpdate } = await supabase
      .from("rooms")
      .update({ participant_id: usuario.id })
      .eq("id", sala.id);

    if (errorUpdate) return { error: "No pudiste unirte." };

    const salaActualizada = { ...sala, participant_id: usuario.id };
    setSalas([salaActualizada, ...salas]);
    setIdSalaActiva(sala.id);
    return { success: true };
  };

  const eliminarSala = async (id: string) => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (!error) {
      setSalas(salas.filter((s) => s.id !== id));
      if (idSalaActiva === id) {
        setIdSalaActiva(null);
        setMensajes([]);
      }
    }
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !usuario || !idSalaActiva) return;

    const salaValida = await validarSalaActiva();
    if (!salaValida) return;

    const { error } = await supabase.from("messages").insert([
      { content: nuevoMensaje, sender_id: usuario.id, room_id: idSalaActiva },
    ]);

    if (error) {
      if (error.code === "23503") {
        setErrorSalaEliminada("Este chat fue eliminado.");
      } else {
        alert("No se pudo enviar el mensaje.");
      }
      return;
    }

    setNuevoMensaje("");
  };

  const mejorarMensajeIA = async () => {
    if (!nuevoMensaje.trim() || !idSalaActiva) return;

    const salaValida = await validarSalaActiva();
    if (!salaValida) return;

    setCargandoIA(true);
    try {
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nuevoMensaje }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data?.details || data?.error || "No se pudo mejorar el mensaje.");
        return;
      }

      if (data.improvedText) setNuevoMensaje(data.improvedText.trim());
    } finally {
      setCargandoIA(false);
    }
  };

  return {
    usuario,
    salas,
    idSalaActiva,
    setIdSalaActiva,
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    cargandoIA,
    perfiles,
    errorSalaEliminada,
    enviarMensaje,
    crearSala,
    unirseASala,
    eliminarSala,
    mejorarMensajeIA,
  };
}
