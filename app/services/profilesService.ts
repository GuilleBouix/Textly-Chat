import type { Perfil } from "../types/database";
import type { AuthMetaUser, PerfilChat, PerfilBusqueda } from "../types/chat";
import { debugError } from "../lib/debug";
import { normalizeAvatarUrl } from "../lib/avatar";

// ============================================
// SERVICIO DE PERFILES
// ============================================

export const profilesService = {
  // Obtiene perfiles publicos de una lista de IDs
  async getPublicProfiles(ids: string[]): Promise<PerfilChat[]> {
    const idsUnicos = Array.from(new Set(ids.filter(Boolean)));
    if (!idsUnicos.length) return [];

    const { data, error } = await import("../lib/supabaseClient").then((m) =>
      m.supabase.from("profiles").select("id, email, username").in("id", idsUnicos),
    );

    if (error) {
      debugError("profiles.getPublic", error);
      return [];
    }

    return (data || []).map((p) => ({
      id: p.id,
      email: p.email || "",
      username: p.username || p.email?.split("@")[0] || "Usuario",
      avatarUrl: null,
    }));
  },

  // Obtiene metadata de auth para una lista de IDs
  async getAuthMetadata(ids: string[]): Promise<Record<string, AuthMetaUser>> {
    const idsUnicos = Array.from(new Set(ids.filter(Boolean)));
    if (!idsUnicos.length) return {};

    try {
      const res = await fetch("/api/users/meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsUnicos }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        debugError("profiles.getAuthMetadata", err);
        return {};
      }

      const body = (await res.json()) as { users?: AuthMetaUser[] };
      const users = body.users ?? [];
      if (!Array.isArray(users)) return {};

      return users.reduce(
        (acc, user) => {
          acc[user.id] = {
            ...user,
            avatarUrl: normalizeAvatarUrl(user.avatarUrl) || null,
          };
          return acc;
        },
        {} as Record<string, AuthMetaUser>,
      );
    } catch (error) {
      debugError("profiles.getAuthMetadata", error);
      return {};
    }
  },

  // Busca perfiles por nombre de usuario
  async searchProfiles(username: string, excludeUserId?: string): Promise<PerfilBusqueda[]> {
    const termino = username.trim();
    if (!termino) return [];

    const { data, error } = await import("../lib/supabaseClient").then((m) => {
      let query = m.supabase
        .from("profiles")
        .select("id, email, username, created_at")
        .ilike("username", `${termino}%`)
        .limit(8);

      if (excludeUserId) {
        query = query.neq("id", excludeUserId);
      }

      return query;
    });

    if (error) {
      debugError("profiles.search", error);
      return [];
    }

    return (data as Perfil[]) || [];
  },

  // Enrich profiles with auth metadata
  async enrichWithAuthMetadata(
    profiles: PerfilChat[],
    authMetadata: Record<string, AuthMetaUser>,
  ): Promise<Record<string, PerfilChat>> {
    return profiles.reduce(
      (acc, perfil) => {
        const auth = authMetadata[perfil.id];
        acc[perfil.id] = {
          ...perfil,
          username: perfil.username || auth?.nombre || "Usuario",
          avatarUrl:
            normalizeAvatarUrl(auth?.avatarUrl) ||
            normalizeAvatarUrl(perfil.avatarUrl) ||
            null,
        };
        return acc;
      },
      {} as Record<string, PerfilChat>,
    );
  },
};
