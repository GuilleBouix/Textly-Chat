import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Amistad,
  Mensaje,
  Perfil,
  Sala,
  UsuarioSupabase,
} from "../types/database";

type PerfilChat = Pick<Perfil, "id" | "email" | "username"> & {
  avatarUrl: string | null;
};

type SolicitudPendiente = Amistad & {
  profiles?: Pick<Perfil, "username" | "email">[] | null;
};

type AuthMetaUser = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

export function useChat() {
  const debug = (...args: unknown[]) => {
    console.log("[chat-debug]", ...args);
  };

  const debugError = (scope: string, error: unknown) => {
    if (error && typeof error === "object") {
      const maybeError = error as {
        code?: string;
        message?: string;
        details?: string;
        hint?: string;
        status?: number;
      };
      console.error("[chat-debug]", scope, {
        code: maybeError.code,
        message: maybeError.message,
        details: maybeError.details,
        hint: maybeError.hint,
        status: maybeError.status,
        raw: error,
      });
      return;
    }
    console.error("[chat-debug]", scope, error);
  };

  const [usuario, setUsuario] = useState<UsuarioSupabase | null>(null);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [idSalaActiva, setIdSalaActiva] = useState<string | null>(null);
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [perfiles, setPerfiles] = useState<Record<string, PerfilChat>>({});
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<
    SolicitudPendiente[]
  >([]);

  const cargarMetadataAuth = async (ids: string[]) => {
    const idsUnicos = Array.from(new Set(ids.filter(Boolean)));
    if (!idsUnicos.length) return;

    try {
      const res = await fetch("/api/users/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsUnicos }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        debug("users.meta:error", err);
        return;
      }

      const body = (await res.json()) as { users?: AuthMetaUser[] };
      const users = body.users ?? [];
      if (!Array.isArray(users)) return;

      setPerfiles((prev) => {
        const next = { ...prev };
        users.forEach((user) => {
          const actual = next[user.id];
          next[user.id] = {
            id: user.id,
            email: user.email || actual?.email || "",
            username: actual?.username || user.nombre || "Usuario",
            avatarUrl: user.avatarUrl || actual?.avatarUrl || null,
          };
        });
        return next;
      });
    } catch (error) {
      debugError("users.meta.fetch", error);
    }
  };

  const cargarPerfilesPublicos = async (ids: string[]) => {
    const idsUnicos = Array.from(new Set(ids.filter(Boolean)));
    if (!idsUnicos.length) return;

    const { data } = await supabase
      .from("profiles")
      .select("id, email, username")
      .in("id", idsUnicos);

    if (data) {
      setPerfiles((prev) => {
        const next = { ...prev };
        data.forEach((perfil) => {
          const actual = next[perfil.id];
          next[perfil.id] = {
            id: perfil.id,
            email: perfil.email || actual?.email || "",
            username:
              perfil.username ||
              actual?.username ||
              perfil.email?.split("@")[0] ||
              "Usuario",
            avatarUrl: actual?.avatarUrl || null,
          };
        });
        return next;
      });
    }

    await cargarMetadataAuth(idsUnicos);
  };

  const cargarSolicitudes = async (userId: string) => {
    const { data } = await supabase
      .from("friendships")
      .select(
        "id, sender_id, receiver_id, status, created_at, profiles:sender_id(username, email)",
      )
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (data) {
      setSolicitudesPendientes(data as SolicitudPendiente[]);
      const idsEmisores = data.map((item) => item.sender_id);
      await cargarPerfilesPublicos(idsEmisores);
    }
  };

  useEffect(() => {
    const inicializar = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUsuario(user as UsuarioSupabase);
      setPerfiles((prev) => ({
        ...prev,
        [user.id]: {
          id: user.id,
          email: user.email || "",
          username:
            (user.user_metadata?.full_name as string) ||
            user.email?.split("@")[0] ||
            "Yo",
          avatarUrl: (user.user_metadata?.avatar_url as string) || null,
        },
      }));

      const { data: salasData } = await supabase
        .from("rooms")
        .select("*")
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (salasData?.length) {
        setSalas(salasData as Sala[]);
        setIdSalaActiva((prev) => prev ?? salasData[0].id);

        const idsContactos = salasData.map((sala) =>
          sala.participant_1 === user.id
            ? sala.participant_2
            : sala.participant_1,
        );
        await cargarPerfilesPublicos(idsContactos);
      }

      await cargarSolicitudes(user.id);
      await cargarMetadataAuth([user.id]);
    };

    inicializar();
  }, []);

  useEffect(() => {
    if (!usuario?.id) return;

    const canalSolicitudes = supabase
      .channel(`friendships-${usuario.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendships",
          filter: `receiver_id=eq.${usuario.id}`,
        },
        (payload) => {
          const nuevaSolicitud = payload.new as SolicitudPendiente;
          if (nuevaSolicitud.status !== "pending") return;

          setSolicitudesPendientes((prev) =>
            prev.some((item) => item.id === nuevaSolicitud.id)
              ? prev
              : [nuevaSolicitud, ...prev],
          );
          void cargarPerfilesPublicos([nuevaSolicitud.sender_id]);
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friendships",
          filter: `receiver_id=eq.${usuario.id}`,
        },
        (payload) => {
          const solicitudActualizada = payload.new as SolicitudPendiente;
          setSolicitudesPendientes((prev) => {
            if (solicitudActualizada.status !== "pending") {
              return prev.filter((item) => item.id !== solicitudActualizada.id);
            }
            return prev.some((item) => item.id === solicitudActualizada.id)
              ? prev
              : [solicitudActualizada, ...prev];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canalSolicitudes);
    };
  }, [usuario?.id]);

  useEffect(() => {
    if (!idSalaActiva) {
      setMensajes([]);
      return;
    }

    const cargarMensajes = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", idSalaActiva)
        .order("created_at", { ascending: true });

      if (data) {
        setMensajes(data as Mensaje[]);
        const idsEmisores = data.map((m) => m.sender_id);
        await cargarPerfilesPublicos(idsEmisores);
      }
    };

    cargarMensajes();

    const canal = supabase
      .channel(`room-${idSalaActiva}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${idSalaActiva}`,
        },
        (payload) => {
          setMensajes((prev) =>
            prev.some((msg) => msg.id === (payload.new as Mensaje).id)
              ? prev
              : [...prev, payload.new as Mensaje],
          );
          const senderId = (payload.new as Mensaje).sender_id;
          void cargarPerfilesPublicos([senderId]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canal);
    };
  }, [idSalaActiva]);

  const buscarUsuarios = async (username: string): Promise<Perfil[]> => {
    const termino = username.trim();
    if (!termino) return [];

    let query = supabase
      .from("profiles")
      .select("id, email, username, created_at")
      .ilike("username", `${termino}%`)
      .limit(8);

    if (usuario?.id) {
      query = query.neq("id", usuario.id);
    }

    const { data } = await query;
    return (data as Perfil[]) || [];
  };

  const agregarAmigo = async (amigoId: string) => {
    debug("agregarAmigo:start", { usuarioId: usuario?.id, amigoId });

    if (!usuario || amigoId === usuario.id) {
      debug("agregarAmigo:skip", {
        reason: !usuario ? "no-user" : "self-friendship",
      });
      return;
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      debugError("auth.getSession", sessionError);
    } else {
      debug("auth.session", {
        hasSession: !!session,
        sessionUserId: session?.user?.id,
        accessTokenPreview: session?.access_token?.slice(0, 16),
      });
    }

    const {
      data: { user: authUser },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      debugError("auth.getUser", userError);
    } else {
      debug("auth.user", {
        authUserId: authUser?.id,
        authEmail: authUser?.email,
      });
    }

    const { data: amistadExistente, error: amistadExistenteError } =
      await supabase
        .from("friendships")
        .select("id, sender_id, receiver_id, status")
        .or(
          `and(sender_id.eq.${usuario.id},receiver_id.eq.${amigoId}),and(sender_id.eq.${amigoId},receiver_id.eq.${usuario.id})`,
        )
        .maybeSingle();

    if (amistadExistenteError) {
      debugError("friendships.maybeSingle", amistadExistenteError);
    } else {
      debug("friendships.maybeSingle:ok", {
        found: !!amistadExistente,
        friendshipId: amistadExistente?.id,
        status: amistadExistente?.status,
      });
    }

    if (amistadExistente) {
      if (amistadExistente.status === "accepted") {
        const { data: salaExistente } = await supabase
          .from("rooms")
          .select("*")
          .or(
            `and(participant_1.eq.${usuario.id},participant_2.eq.${amigoId}),and(participant_1.eq.${amigoId},participant_2.eq.${usuario.id})`,
          )
          .maybeSingle();

        if (salaExistente) {
          setIdSalaActiva(salaExistente.id);
          await cargarPerfilesPublicos([amigoId]);
          debug("agregarAmigo:end", { action: "open-existing-room" });
          return;
        }
      }

      debug("agregarAmigo:end", { action: "friendship-already-exists" });
      return;
    }

    const payload = {
      sender_id: usuario.id,
      receiver_id: amigoId,
      status: "pending" as const,
    };
    debug("friendships.insert:payload", payload);

    const { error: amistadInsertError } = await supabase
      .from("friendships")
      .insert([payload]);

    if (amistadInsertError) {
      debugError("friendships.insert", amistadInsertError);
      throw amistadInsertError;
    }

    await cargarPerfilesPublicos([amigoId]);
    debug("friendships.insert:ok");
    debug("agregarAmigo:end", { action: "request-sent" });
  };

  const aceptarSolicitud = async (solicitudId: string, emisorId: string) => {
    if (!usuario) return;

    debug("aceptarSolicitud:start", {
      solicitudId,
      emisorId,
      receptorId: usuario.id,
    });

    const { error: updateError } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", solicitudId)
      .eq("receiver_id", usuario.id);

    if (updateError) {
      debugError("friendships.update.accepted", updateError);
      throw updateError;
    }

    const [participant1, participant2] = [usuario.id, emisorId].sort();
    const { data: room, error: roomError } = await supabase
      .from("rooms")
      .insert([{ participant_1: participant1, participant_2: participant2 }])
      .select()
      .single();

    if (roomError) {
      debugError("rooms.insert.after-accept", roomError);

      const { data: fallbackRoom } = await supabase
        .from("rooms")
        .select("*")
        .or(
          `and(participant_1.eq.${usuario.id},participant_2.eq.${emisorId}),and(participant_1.eq.${emisorId},participant_2.eq.${usuario.id})`,
        )
        .maybeSingle();

      if (fallbackRoom) {
        setSalas((prev) =>
          prev.some((sala) => sala.id === fallbackRoom.id)
            ? prev
            : [fallbackRoom as Sala, ...prev],
        );
        setIdSalaActiva(fallbackRoom.id);
      }
    } else {
      setSalas((prev) =>
        prev.some((sala) => sala.id === room.id) ? prev : [room as Sala, ...prev],
      );
      setIdSalaActiva(room.id);
    }

    setSolicitudesPendientes((prev) =>
      prev.filter((solicitud) => solicitud.id !== solicitudId),
    );
    await cargarPerfilesPublicos([emisorId]);
    debug("aceptarSolicitud:end");
  };

  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !usuario || !idSalaActiva) return;

    const { data: insertedMessage, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: usuario.id,
          room_id: idSalaActiva,
          content: nuevoMensaje.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      debugError("messages.insert", error);
      alert("No se pudo enviar el mensaje.");
      return;
    }

    if (insertedMessage) {
      setMensajes((prev) =>
        prev.some((msg) => msg.id === insertedMessage.id)
          ? prev
          : [...prev, insertedMessage as Mensaje],
      );
      void cargarPerfilesPublicos([(insertedMessage as Mensaje).sender_id]);
    }

    setNuevoMensaje("");
  };

  const eliminarSala = async (idSala: string) => {
    await supabase.from("rooms").delete().eq("id", idSala);
    setSalas((prev) => {
      const restantes = prev.filter((sala) => sala.id !== idSala);
      if (idSalaActiva === idSala) {
        setIdSalaActiva(restantes[0]?.id ?? null);
        setMensajes([]);
      }
      return restantes;
    });
  };

  const mejorarMensajeIA = async () => {
    if (!nuevoMensaje.trim()) return;

    try {
      setCargandoIA(true);
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nuevoMensaje }),
      });

      const body = await res.json();
      if (res.ok && body?.improvedText) {
        setNuevoMensaje(body.improvedText);
      }
    } finally {
      setCargandoIA(false);
    }
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const buscarPorUsername = buscarUsuarios;
  const enviarSolicitudAmistad = agregarAmigo;

  return {
    usuario,
    salas,
    idSalaActiva,
    setIdSalaActiva,
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    perfiles,
    solicitudesPendientes,
    cargandoIA,
    enviarMensaje,
    eliminarSala,
    mejorarMensajeIA,
    cerrarSesion,
    buscarUsuarios,
    agregarAmigo,
    buscarPorUsername,
    enviarSolicitudAmistad,
    aceptarSolicitud,
  };
}
