import { supabase } from "../lib/supabaseClient";

import { debugError } from "../lib/debug";

// ============================================
// TIPOS
// ============================================

export interface UserSettings {
  id: string;
  assistant_enabled: boolean;
  writing_mode: "formal" | "informal";
  language: "es" | "en" | "pt";
  created_at: string;
}

export interface UserSettingsInput {
  assistant_enabled?: boolean;
  writing_mode?: "formal" | "informal";
  language?: "es" | "en" | "pt";
}

// ============================================
// SERVICIO DE CONFIGURACION
// ============================================

export const settingsService = {
  // Obtiene la configuracion del usuario
  async getSettings(userId: string): Promise<UserSettings | null> {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    // Si no hay error pero tampoco datos, es normal (primera vez)
    if (error) {
      // No rows returned - normal en primera vez
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error obteniendo settings:", error);
      debugError("settings.get", error);
      return null;
    }

    return data as UserSettings;
  },

  // Obtiene o crea la configuracion con defaults
  async getOrCreateSettings(userId: string): Promise<UserSettings> {
    const existente = await settingsService.getSettings(userId);

    if (existente) {
      return existente;
    }

    // Crear con defaults
    const nuevo = await settingsService.upsertSettings(userId, {
      assistant_enabled: true,
      writing_mode: "informal",
      language: "es",
    });

    return nuevo || {
      id: userId,
      assistant_enabled: true,
      writing_mode: "informal",
      language: "es",
      created_at: new Date().toISOString(),
    };
  },

  // Crea o actualiza la configuracion
  async upsertSettings(
    userId: string,
    settings: UserSettingsInput,
  ): Promise<UserSettings | null> {
    const { data, error } = await supabase
      .from("user_settings")
      .upsert({
        id: userId,
        ...settings,
      })
      .select()
      .single();

    if (error) {
      debugError("settings.upsert", error);
      return null;
    }

    return data as UserSettings;
  },

  // Actualiza solo algunos campos
  async updateSettings(
    userId: string,
    settings: Partial<UserSettingsInput>,
  ): Promise<UserSettings | null> {
    return settingsService.upsertSettings(userId, settings);
  },
};
