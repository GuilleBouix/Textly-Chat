export interface Perfil {
  id: string;
  email: string;
  username: string | null;
  created_at: string;
}

export interface Sala {
  id: string;
  room_name: string | null;
  participant_1: string;
  participant_2: string | null;
  share_code: string;
  created_at: string;
}

export interface Mensaje {
  id: string;
  room_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}
