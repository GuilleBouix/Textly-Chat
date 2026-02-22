"use client";
import { useState, useCallback } from "react";
import { profilesService } from "../../services/profilesService";
import type { PerfilChat } from "../../types/chat";
import type { PerfilBusqueda } from "../../types/chat";
import { normalizeAvatarUrl } from "../../lib/avatar";

// ============================================
// HOOK DE PERFILES
// ============================================

export function useProfiles() {
  // ============================================
  // ESTADOS
  // ============================================

  // Cache de perfiles de usuarios
  const [perfiles, setPerfiles] = useState<Record<string, PerfilChat>>({});

  // ============================================
  // FUNCIONES
  // ============================================

  // Carga perfiles publicos y metadata de auth
  const cargarPerfilesPublicos = useCallback(async (ids: string[]) => {
    if (!ids.length) return;

    const perfilesPublicos = await profilesService.getPublicProfiles(ids);
    const authMetadata = await profilesService.getAuthMetadata(ids);
    const perfilesEnriquecidos = await profilesService.enrichWithAuthMetadata(
      perfilesPublicos,
      authMetadata,
    );

    setPerfiles((prev) => ({ ...prev, ...perfilesEnriquecidos }));
  }, []);

  // Busca usuarios por nombre de usuario
  const buscarUsuarios = async (
    username: string,
    excludeUserId?: string,
  ): Promise<PerfilBusqueda[]> => {
    const users = await profilesService.searchProfiles(username, excludeUserId);

    const ids = users.map((u) => u.id);
    if (!ids.length) return users;

    const authMetadata = await profilesService.getAuthMetadata(ids);
    return users.map((u) => ({
      ...u,
      avatarUrl: normalizeAvatarUrl(authMetadata[u.id]?.avatarUrl) || null,
    }));
  };

  // Agrega el perfil del usuario actual
  const agregarPerfilUsuario = useCallback(
    (
      userId: string,
      data: { email: string; username: string; avatarUrl: string | null },
    ) => {
      setPerfiles((prev) => ({
        ...prev,
        [userId]: {
          id: userId,
          email: data.email,
          username: data.username,
          avatarUrl: data.avatarUrl,
        },
      }));
    },
    [],
  );

  // ============================================
  // RETORNO
  // ============================================

  return {
    perfiles,
    setPerfiles,
    cargarPerfilesPublicos,
    buscarUsuarios,
    agregarPerfilUsuario,
  };
}
