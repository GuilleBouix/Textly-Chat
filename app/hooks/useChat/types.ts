import type { UsuarioSupabase, Sala, Mensaje } from "../../types/database";
import type { PerfilChat, SolicitudPendiente, PerfilBusqueda } from "../../types/chat";

// ============================================
// TIPOS PARA LOS HOOKS DEL CHAT
// ============================================

// Estado del usuario autenticado
export interface UseAuthState {
  usuario: UsuarioSupabase | null;
}

// Estado de las salas
export interface UseRoomsState {
  salas: Sala[];
  idSalaActiva: string | null;
  setIdSalaActiva: (id: string | null) => void;
}

// Estado de los mensajes
export interface UseMessagesState {
  mensajes: Mensaje[];
  nuevoMensaje: string;
  setNuevoMensaje: (msg: string) => void;
  mensajesNoLeidos: Record<string, number>;
}

// Estado de las solicitudes de amistad
export interface UseFriendshipsState {
  solicitudesPendientes: SolicitudPendiente[];
  solicitudesEnviadas: SolicitudPendiente[];
}

// Estado de los perfiles
export interface UseProfilesState {
  perfiles: Record<string, PerfilChat>;
}

// Acciones del chat
export interface UseChatActions {
  cerrarSesion: () => Promise<void>;
  enviarMensaje: (e: React.FormEvent) => Promise<void>;
  eliminarSala: (idSala: string) => Promise<void>;
  mejorarMensajeIA: () => Promise<void>;
  buscarUsuarios: (username: string) => Promise<PerfilBusqueda[]>;
  buscarPorUsername: (username: string) => Promise<PerfilBusqueda[]>;
  agregarAmigo: (amigoId: string) => Promise<void>;
  enviarSolicitudAmistad: (amigoId: string) => Promise<void>;
  aceptarSolicitud: (solicitudId: string, emisorId: string) => Promise<void>;
  cancelarSolicitud: (solicitudId: string) => Promise<void>;
  marcarChatComoLeido: (idSala: string) => void;
}

// Estado de carga de IA
export interface UseIAState {
  cargandoIA: boolean;
}

// Tipo completo del hook
export interface UseChatReturn extends UseAuthState, UseRoomsState, UseMessagesState, UseFriendshipsState, UseProfilesState, UseIAState, UseChatActions {}

// Funciones helper para perfiles
export type PerfilLoader = (ids: string[]) => Promise<void>;
export type BuscarUsuariosFn = (username: string, excludeUserId?: string) => Promise<PerfilBusqueda[]>;
