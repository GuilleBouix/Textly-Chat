"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { debugError } from "../../lib/debug";
import { messagesService } from "../../services/messagesService";
import type { Mensaje, Sala } from "../../types/database";
import type { PerfilLoader } from "./types";
import { localCache } from "../../lib/localCache";

// ============================================
// HOOK DE MENSAJES
// ============================================

interface UseMessagesProps {
  userId: string | undefined;
  idSalaActiva: string | null;
  salas: Sala[];
  cargarPerfiles: PerfilLoader;
}

const CACHE_MENSAJES_MS = 1000 * 60 * 60 * 12;
const MAX_MENSAJES_CACHE = 120;
const getMensajesCacheKey = (userId: string, roomId: string) =>
  `textly:messages:${userId}:${roomId}`;

// ============================================
// HOOK
// ============================================

export function useMessages({
  userId,
  idSalaActiva,
  salas,
  cargarPerfiles,
}: UseMessagesProps) {
  // ============================================
  // ESTADOS
  // ============================================

  // Mensajes de la sala activa
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);

  // Nuevo mensaje que se esta escribiendo
  const [nuevoMensaje, setNuevoMensaje] = useState("");

  // Contador de mensajes no leidos por sala
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState<
    Record<string, number>
  >({});

  // ============================================
  // FUNCIONES
  // ============================================

  // Carga mensajes de una sala
  const cargarMensajes = useCallback(async (roomId: string) => {
    const data = await messagesService.getByRoom(roomId);
    setMensajes(data);
    if (userId) {
      localCache.write(
        getMensajesCacheKey(userId, roomId),
        data.slice(-MAX_MENSAJES_CACHE),
      );
    }

    const idsEmisores = data.map((m) => m.sender_id);
    await cargarPerfiles(idsEmisores);
  }, [userId, cargarPerfiles]);

  // Envia un mensaje a la sala activa
  const enviarMensaje = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !userId || !idSalaActiva) return;

    const insertedMessage = await messagesService.createMessage(
      idSalaActiva,
      userId,
      nuevoMensaje,
    );

    if (!insertedMessage) {
      debugError("messages.insert", new Error("Failed to send message"));
      alert("No se pudo enviar el mensaje.");
      return;
    }

    setMensajes((prev) =>
      prev.some((msg) => msg.id === insertedMessage.id)
        ? prev
        : [...prev, insertedMessage],
    );
    void cargarPerfiles([insertedMessage.sender_id]);

    setNuevoMensaje("");
  };

  // Marca un chat como leido
  const marcarChatComoLeido = (roomId: string) => {
    setMensajesNoLeidos((prev) => ({ ...prev, [roomId]: 0 }));
  };

  // Agrega un mensaje al estado
  const agregarMensaje = (nuevo: Mensaje) => {
    setMensajes((prev) =>
      prev.some((msg) => msg.id === nuevo.id) ? prev : [...prev, nuevo],
    );
  };

  // ============================================
  // EFECTOS
  // ============================================

  // Carga mensajes cuando cambia la sala activa
  useEffect(() => {
    if (!idSalaActiva) {
      setMensajes([]);
      return;
    }

    setMensajesNoLeidos((prev) => ({ ...prev, [idSalaActiva]: 0 }));

    if (userId) {
      const cache = localCache.read<Mensaje[]>(
        getMensajesCacheKey(userId, idSalaActiva),
        CACHE_MENSAJES_MS,
      );
      if (cache) {
        setMensajes(cache);
        void cargarPerfiles(cache.map((m) => m.sender_id));
      } else {
        setMensajes([]);
      }
    } else {
      setMensajes([]);
    }

    void cargarMensajes(idSalaActiva);
  }, [idSalaActiva, userId, cargarMensajes, cargarPerfiles]);

  useEffect(() => {
    if (!userId || !idSalaActiva) return;
    localCache.write(
      getMensajesCacheKey(userId, idSalaActiva),
      mensajes.slice(-MAX_MENSAJES_CACHE),
    );
  }, [userId, idSalaActiva, mensajes]);

  // Suscripcion a mensajes en tiempo real
  useEffect(() => {
    if (!userId) return;

    const canalInbox = supabase
      .channel(`messages-inbox-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const nuevoMensaje = payload.new as Mensaje;
          const salaExiste = salas.some(
            (sala) => sala.id === nuevoMensaje.room_id,
          );
          if (!salaExiste) return;

          if (nuevoMensaje.room_id === idSalaActiva) {
            agregarMensaje(nuevoMensaje);
          } else if (nuevoMensaje.sender_id !== userId) {
            setMensajesNoLeidos((prev) => ({
              ...prev,
              [nuevoMensaje.room_id]: (prev[nuevoMensaje.room_id] || 0) + 1,
            }));
          }

          void cargarPerfiles([nuevoMensaje.sender_id]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canalInbox);
    };
  }, [userId, salas, idSalaActiva, cargarPerfiles]);

  // ============================================
  // RETORNO
  // ============================================

  return {
    mensajes,
    setMensajes,
    nuevoMensaje,
    setNuevoMensaje,
    mensajesNoLeidos,
    cargarMensajes,
    enviarMensaje,
    marcarChatComoLeido,
  };
}
