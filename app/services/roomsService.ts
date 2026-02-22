import { supabase } from "../lib/supabaseClient";
import type { Sala } from "../types/database";
import { debugError } from "../lib/debug";

// ============================================
// SERVICIO DE SALAS (ROOMS)
// ============================================

export const roomsService = {
  // Obtiene todas las salas de un usuario
  async getRoomsByUser(userId: string): Promise<Sala[]> {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
      .order("created_at", { ascending: false });

    if (error) {
      debugError("rooms.getByUser", error);
      return [];
    }
    return (data as Sala[]) || [];
  },

  // Crea una nueva sala entre dos participantes
  async createRoom(
    participant1: string,
    participant2: string,
  ): Promise<Sala | null> {
    const [p1, p2] = [participant1, participant2].sort();
    const { data, error } = await supabase
      .from("rooms")
      .insert([{ participant_1: p1, participant_2: p2 }])
      .select()
      .single();

    if (error) {
      debugError("rooms.insert", error);
      return null;
    }
    return data as Sala;
  },

  // Busca una sala existente entre dos participantes
  async findRoomByParticipants(
    userId1: string,
    userId2: string,
  ): Promise<Sala | null> {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .or(
        `and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      debugError("rooms.findByParticipants", error);
      return null;
    }
    return data as Sala | null;
  },

  // Elimina una sala por su ID
  async deleteRoom(roomId: string): Promise<void> {
    const { error } = await supabase.from("rooms").delete().eq("id", roomId);
    if (error) {
      debugError("rooms.delete", error);
    }
  },
};
