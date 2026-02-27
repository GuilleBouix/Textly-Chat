// ---------------- IMPORTACIONES ----------------
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { guardarCache, leerCache } from "../lib/cacheLocal";
import { Mensaje } from "../types/database";

// ---------------- CONSTANTES ----------------
const TTL_CACHE_MS = 5 * 60 * 1000;
const PREFIJO_CACHE_MENSAJES = "textly_cache_mensajes_v1";

// ---------------- FUNCIONES ----------------
const obtenerClaveCacheMensajes = (usuarioId: string, idSala: string): string => {
  return `${PREFIJO_CACHE_MENSAJES}:${usuarioId}:${idSala}`;
};

// ---------------- HOOK ----------------
export const useMensajes = (
  idSalaActiva: string | null,
  usuarioId: string | undefined,
  validarSala: () => Promise<unknown>,
  onErrorSalaEliminada: (error: string) => void,
  onCargarPerfiles: (ids: string[]) => Promise<void>,
) => {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  useEffect(() => {
    if (!idSalaActiva || !usuarioId) return;
    guardarCache(
      obtenerClaveCacheMensajes(usuarioId, idSalaActiva),
      mensajes,
      TTL_CACHE_MS,
    );
  }, [mensajes, idSalaActiva, usuarioId]);

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
    if (!idSalaActiva || !usuarioId) {
      return;
    }

    const claveCacheMensajes = obtenerClaveCacheMensajes(usuarioId, idSalaActiva);
    const lecturaMensajes = leerCache<Mensaje[]>(claveCacheMensajes);
    if (lecturaMensajes.valido && lecturaMensajes.datos) {
      void Promise.resolve().then(() => {
        setMensajes(lecturaMensajes.datos as Mensaje[]);
      });
      const idsRemitentesCache = lecturaMensajes.datos.map((m) => m.sender_id);
      void onCargarPerfiles(idsRemitentesCache);
    }

    const cargarMensajes = async (): Promise<void> => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("room_id", idSalaActiva)
        .order("created_at", { ascending: true });

      if (data) {
        setMensajes(data);
        guardarCache(claveCacheMensajes, data, TTL_CACHE_MS);
        const senderIds = data.map((m) => m.sender_id);
        await onCargarPerfiles(senderIds);
      }
    };

    void cargarMensajes();

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
          setMensajes((prev) => {
            const siguientes = prev.some((m) => m.id === msg.id) ? prev : [...prev, msg];
            guardarCache(claveCacheMensajes, siguientes, TTL_CACHE_MS);
            return siguientes;
          });
          void onCargarPerfiles([msg.sender_id]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalMensajes);
    };
  }, [idSalaActiva, usuarioId, onCargarPerfiles]);

  return {
    mensajes,
    enviarMensaje,
    setMensajes,
  };
};

