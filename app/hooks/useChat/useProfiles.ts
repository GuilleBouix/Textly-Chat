"use client";
import { useState, useCallback, useEffect, useRef } from "react";
import { profilesService } from "../../services/profilesService";
import type { PerfilChat } from "../../types/chat";
import type { PerfilBusqueda } from "../../types/chat";
import { normalizeAvatarUrl } from "../../lib/avatar";
import { localCache } from "../../lib/localCache";

// ============================================
// HOOK DE PERFILES
// ============================================

interface UseProfilesProps {
  userId: string | undefined;
}

const CACHE_PERFILES_MS = 1000 * 60 * 60 * 24;

const getPerfilesCacheKey = (userId: string) => `textly:profiles:${userId}`;

export function useProfiles({ userId }: UseProfilesProps) {
  // ============================================
  // ESTADOS
  // ============================================

  // Cache de perfiles de usuarios
  const [perfiles, setPerfiles] = useState<Record<string, PerfilChat>>({});
  const perfilesRef = useRef<Record<string, PerfilChat>>({});

  useEffect(() => {
    perfilesRef.current = perfiles;
  }, [perfiles]);

  useEffect(() => {
    if (!userId) {
      setPerfiles({});
      return;
    }

    const cache = localCache.read<Record<string, PerfilChat>>(
      getPerfilesCacheKey(userId),
      CACHE_PERFILES_MS,
    );
    if (cache) {
      setPerfiles(cache);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    localCache.write(getPerfilesCacheKey(userId), perfiles);
  }, [userId, perfiles]);

  // ============================================
  // FUNCIONES
  // ============================================

  // Carga perfiles publicos y metadata de auth
  const cargarPerfilesPublicos = useCallback(async (ids: string[]) => {
    if (!ids.length) return;

    const idsPendientes = Array.from(new Set(ids.filter(Boolean))).filter(
      (id) => !perfilesRef.current[id],
    );
    if (!idsPendientes.length) return;

    const perfilesPublicos = await profilesService.getPublicProfiles(idsPendientes);
    const authMetadata = await profilesService.getAuthMetadata(idsPendientes);
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
