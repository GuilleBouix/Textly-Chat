import type { Perfil, Mensaje, Sala, Amistad } from "./database";

// ============================================
// TIPOS DERIVADOS PARA EL CHAT
// ============================================

// Perfil enriquecido con avatar para el chat
export type PerfilChat = Pick<Perfil, "id" | "email" | "username"> & {
  avatarUrl: string | null;
};

// Solicitud de amistad pendiente
export type SolicitudPendiente = Amistad & {
  profiles?: Pick<Perfil, "username" | "email">[] | null;
};

// Metadata de usuario desde auth de Supabase
export type AuthMetaUser = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

// Perfil para busqueda de usuarios
export type PerfilBusqueda = Perfil & {
  avatarUrl?: string | null;
};

// Alias para mensaje de chat
export type ChatMessage = Mensaje;

// Alias para sala de chat
export type ChatRoom = Sala;

// Estado de amistad
export type FriendshipStatus = "pending" | "accepted" | "blocked";
