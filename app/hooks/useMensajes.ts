// ----------- IMPORTS -----------
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Mensaje } from "../types/database";

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
    if (!idSalaActiva || !usuarioId) {
      return;
    }

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
          setMensajes((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
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
