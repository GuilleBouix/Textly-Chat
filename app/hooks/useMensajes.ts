// ----------- IMPORTS -----------
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Mensaje } from "../types/database";

// ----------- TIPOS -----------
type MensajesLocalCache = {
  version: 1;
  savedAt: number;
  mensajes: Mensaje[];
};

// ----------- CONSTANTES -----------
const MENSAJES_CACHE_TTL_MS = 30 * 1000;
const MENSAJES_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

// ----------- FUNCIONES -----------
const cacheKeyMensajes = (usuarioId: string, salaId: string): string =>
  `textly:messages-cache:${usuarioId}:${salaId}`;

const leerCacheMensajes = (usuarioId: string, salaId: string): MensajesLocalCache | null => {
  try {
    const raw = localStorage.getItem(cacheKeyMensajes(usuarioId, salaId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MensajesLocalCache;
    if (!parsed || parsed.version !== 1) return null;
    if (Date.now() - parsed.savedAt > MENSAJES_CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const guardarCacheMensajes = (usuarioId: string, salaId: string, mensajes: Mensaje[]): void => {
  try {
    localStorage.setItem(
      cacheKeyMensajes(usuarioId, salaId),
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        mensajes: mensajes.slice(-300),
      } satisfies MensajesLocalCache),
    );
  } catch {}
};

const borrarCacheMensajes = (usuarioId: string, salaId: string): void => {
  try {
    localStorage.removeItem(cacheKeyMensajes(usuarioId, salaId));
  } catch {}
};

// ----------- EXPORT HOOK -----------
export const useMensajes = (
  idSalaActiva: string | null,
  usuarioId: string | undefined,
  validarSala: () => Promise<unknown>,
  onErrorSalaEliminada: (error: string) => void,
  onCargarPerfiles: (ids: string[]) => Promise<void>,
) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  const enviarMensaje = async (contenido: string): Promise<void> => {
    if (!contenido.trim() || !usuarioId || !idSalaActiva) return;

    const salaValida = await validarSala();
    if (!salaValida) return;

    const { error } = await supabase.from("messages").insert([
      { content: contenido, sender_id: usuarioId, room_id: idSalaActiva },
    ]);

    if (error) {
      if (error.code === "23503") {
        onErrorSalaEliminada("Este chat fue eliminado.");
      } else {
        alert("No se pudo enviar el mensaje.");
      }
    }
  };

  useEffect(() => {
    if (!idSalaActiva || !usuarioId) return;

    const cache = leerCacheMensajes(usuarioId, idSalaActiva);
    if (cache?.mensajes?.length) {
      setMensajes(cache.mensajes);
      void onCargarPerfiles(cache.mensajes.map((m) => m.sender_id));
    } else {
      setMensajes([]);
    }

    const cacheReciente = cache && Date.now() - cache.savedAt < MENSAJES_CACHE_TTL_MS;

    const cargarMensajes = async (): Promise<void> => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", idSalaActiva)
        .order("created_at", { ascending: true });

      if (data) {
        setMensajes(data);
        const senderIds = data.map((m) => m.sender_id);
        await onCargarPerfiles(senderIds);
      }
    };

    if (!cacheReciente) {
      void cargarMensajes();
    }

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
          setMensajes((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
          void onCargarPerfiles([msg.sender_id]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalMensajes);
    };
  }, [idSalaActiva, usuarioId, onCargarPerfiles]);

  useEffect(() => {
    if (!idSalaActiva || !usuarioId) return;
    guardarCacheMensajes(usuarioId, idSalaActiva, mensajes);
  }, [usuarioId, idSalaActiva, mensajes]);

  const limpiarCacheSala = (salaId: string): void => {
    if (!usuarioId || !salaId) return;
    borrarCacheMensajes(usuarioId, salaId);
  };

  return {
    mensajes,
    enviarMensaje,
    setMensajes,
    limpiarCacheSala,
  };
};
