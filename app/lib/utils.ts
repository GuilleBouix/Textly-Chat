// ----------- UTILIDADES DE FORMATEO Y HELPERS -----------
import { pickAvatarFromMetadata } from "./avatar";

// Formatea una fecha ISO a hora local española (HH:mm)
export const formatearHora = (fechaISO: string): string => {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "--:--";

  return fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

// Obtiene la inicial de un nombre o email para mostrar como avatar
export const inicialNombre = (nombre?: string, email?: string): string => {
  if (nombre?.trim()) return nombre.trim().charAt(0).toUpperCase();
  if (email?.trim()) return email.trim().charAt(0).toUpperCase();
  return "?";
};

// Genera un código aleatorio de 8 dígitos para compartir salas
export const generarCodigoSala = (): string => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

// Crea un perfil básico desde los datos del usuario de Supabase Auth
export const crearPerfilDesdeAuth = (usuario: {
  id: string;
  email?: string;
  user_metadata?: Record<string, unknown>;
}): {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
} => {
  return {
    id: usuario.id,
    email: usuario.email ?? undefined,
    nombre:
      (usuario.user_metadata?.full_name as string) ||
      (usuario.user_metadata?.name as string) ||
      usuario.email?.split("@")[0] ||
      "Usuario",
    avatarUrl: pickAvatarFromMetadata(usuario.user_metadata),
  };
};
