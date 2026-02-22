export interface UsuarioSupabase {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
    [key: string]: unknown;
  };
}

export interface Perfil {
  id: string;
  email: string;
  username: string | null;
  created_at: string;
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
  participant_1: string;
  participant_2: string;
}

export interface Amistad {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: "pending" | "accepted" | "blocked";
  created_at: string;
}
