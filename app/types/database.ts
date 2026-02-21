export interface UsuarioSupabase {
  id: string;
  email?: string;
}

export interface Mensaje {
  id: string;
  created_at: string;
  content: string;
  sender_id: string;
  room_id: string;
}

export interface Sala {
  id: string;
  created_at: string;
  creator_id: string;
  participant_id: string | null;
  share_code: string;
}
