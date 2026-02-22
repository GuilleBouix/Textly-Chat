import { supabase } from "../lib/supabaseClient";
import type { UsuarioSupabase } from "../types/database";
import { debug, debugError } from "../lib/debug";

// ============================================
// SERVICIO DE AUTENTICACION
// ============================================

export const authService = {
  // Obtiene el usuario actualmente autenticado
  async getCurrentUser(): Promise<UsuarioSupabase | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user as UsuarioSupabase | null;
  },

  // Obtiene la sesion actual y hace debug
  async getSession() {
    const result = await supabase.auth.getSession();
    if (result.error) {
      debugError("auth.getSession", result.error);
    } else {
      debug("auth.session", {
        hasSession: !!result.data.session,
        sessionUserId: result.data.session?.user?.id,
        accessTokenPreview: result.data.session?.access_token?.slice(0, 16),
      });
    }
    return result;
  },

  // Obtiene el usuario actual y hace debug
  async getUser() {
    const result = await supabase.auth.getUser();
    if (result.error) {
      debugError("auth.getUser", result.error);
    } else {
      debug("auth.user", {
        authUserId: result.data.user?.id,
        authEmail: result.data.user?.email,
      });
    }
    return result;
  },

  // Cierra la sesion del usuario
  async signOut(): Promise<void> {
    await supabase.auth.signOut();
  },
};
