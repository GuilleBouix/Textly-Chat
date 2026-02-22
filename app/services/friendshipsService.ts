import { supabase } from "../lib/supabaseClient";
import type { Amistad } from "../types/database";
import type { SolicitudPendiente } from "../types/chat";
import { debugError } from "../lib/debug";

// ============================================
// SERVICIO DE AMISTADES
// ============================================

export const friendshipsService = {
  // Obtiene solicitudes de amistad recibidas pendientes
  async getPendingReceived(userId: string): Promise<SolicitudPendiente[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(
        "id, sender_id, receiver_id, status, created_at, profiles:sender_id(username, email)",
      )
      .eq("receiver_id", userId)
      .eq("status", "pending");

    if (error) {
      debugError("friendships.getPendingReceived", error);
      return [];
    }
    return (data as SolicitudPendiente[]) || [];
  },

  // Obtiene solicitudes de amistad enviadas pendientes
  async getPendingSent(userId: string): Promise<SolicitudPendiente[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(
        "id, sender_id, receiver_id, status, created_at, profiles:receiver_id(username, email)",
      )
      .eq("sender_id", userId)
      .eq("status", "pending");

    if (error) {
      debugError("friendships.getPendingSent", error);
      return [];
    }
    return (data as SolicitudPendiente[]) || [];
  },

  // Busca una amistad entre dos usuarios
  async findFriendship(
    userId1: string,
    userId2: string,
  ): Promise<Amistad | null> {
    const { data, error } = await supabase
      .from("friendships")
      .select("id, sender_id, receiver_id, status")
      .or(
        `and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      debugError("friendships.find", error);
      return null;
    }
    return data as Amistad | null;
  },

  // Crea una nueva solicitud de amistad
  async createFriendship(
    senderId: string,
    receiverId: string,
  ): Promise<Amistad | null> {
    const { data, error } = await supabase
      .from("friendships")
      .insert([
        { sender_id: senderId, receiver_id: receiverId, status: "pending" },
      ])
      .select("id, sender_id, receiver_id, status, created_at")
      .single();

    if (error) {
      debugError("friendships.insert", error);
      return null;
    }
    return data as Amistad;
  },

  // Acepta una solicitud de amistad
  async acceptFriendship(
    friendshipId: string,
    receiverId: string,
  ): Promise<boolean> {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId)
      .eq("receiver_id", receiverId);

    if (error) {
      debugError("friendships.accept", error);
      return false;
    }
    return true;
  },

  // Elimina una solicitud de amistad
  async deleteFriendship(
    friendshipId: string,
    senderId: string,
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from("friendships")
      .delete()
      .eq("id", friendshipId)
      .eq("sender_id", senderId)
      .select("id")
      .maybeSingle();

    if (error) {
      debugError("friendships.delete", error);
      return false;
    }
    return !!data;
  },

  // Suscribe a cambios en amistades de un usuario
  subscribeToFriendships(
    userId: string,
    callbacks: {
      onInsert?: (newFriendship: Amistad) => void;
      onUpdate?: (updatedFriendship: Amistad) => void;
      onDelete?: (deletedFriendship: Amistad) => void;
    },
  ) {
    const channel = supabase.channel(`friendships-${userId}`);

    // Suscribe a nuevas solicitudes
    if (callbacks.onInsert) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "friendships",
        },
        (payload) => {
          callbacks.onInsert!(payload.new as Amistad);
        },
      );
    }

    // Suscribe a actualizaciones de solicitudes
    if (callbacks.onUpdate) {
      channel.on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "friendships",
        },
        (payload) => {
          callbacks.onUpdate!(payload.new as Amistad);
        },
      );
    }

    // Suscribe a eliminaciones de solicitudes
    if (callbacks.onDelete) {
      channel.on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "friendships",
        },
        (payload) => {
          callbacks.onDelete!(payload.old as Amistad);
        },
      );
    }

    channel.subscribe();
    return channel;
  },
};
