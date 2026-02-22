import { supabase } from "../lib/supabaseClient";
import type { Mensaje } from "../types/database";
import { debugError } from "../lib/debug";

// ============================================
// SERVICIO DE MENSAJES
// ============================================

export const messagesService = {
  // Obtiene todos los mensajes de una sala
  async getByRoom(roomId: string): Promise<Mensaje[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });

    if (error) {
      debugError("messages.getByRoom", error);
      return [];
    }
    return (data as Mensaje[]) || [];
  },

  // Crea un nuevo mensaje en una sala
  async createMessage(
    roomId: string,
    senderId: string,
    content: string,
  ): Promise<Mensaje | null> {
    const { data, error } = await supabase
      .from("messages")
      .insert([
        {
          sender_id: senderId,
          room_id: roomId,
          content: content.trim(),
        },
      ])
      .select()
      .single();

    if (error) {
      debugError("messages.insert", error);
      return null;
    }
    return data as Mensaje;
  },

  // Suscribe a nuevos mensajes de una sala
  subscribeToRoom(roomId: string, callback: (newMessage: Mensaje) => void) {
    const channel = supabase
      .channel(`room-${roomId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          callback(payload.new as Mensaje);
        },
      )
      .subscribe();

    return channel;
  },
};
