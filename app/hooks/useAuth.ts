// ----------- IMPORTS -----------
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { pickAvatarFromMetadata } from "../lib/avatar";

// ----------- TIPOS -----------
export type UsuarioPerfil = {
  id: string;
  email?: string;
  nombre?: string;
  username?: string;
  avatarUrl?: string | null;
};

type UsuarioPerfilCache = {
  userId: string;
  savedAt: number;
  nombre?: string;
  username?: string;
  avatarUrl?: string | null;
};

// ----------- CONSTANTES -----------
const AUTH_CACHE_KEY = "textly:auth-profile";
const AUTH_CACHE_TTL_MS = 10 * 60 * 1000;

// ----------- FUNCIONES -----------
const cerrarSesion = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error al cerrar sesion:", error.message);
    alert("No se pudo cerrar sesion. Intentalo de nuevo.");
    return;
  }

  try {
    localStorage.removeItem(AUTH_CACHE_KEY);
  } catch {}

  window.location.href = "/login";
};

const obtenerCacheAuth = (): UsuarioPerfilCache | null => {
  try {
    const raw = localStorage.getItem(AUTH_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UsuarioPerfilCache;
  } catch {
    return null;
  }
};

const guardarCacheAuth = (payload: UsuarioPerfilCache): void => {
  try {
    localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(payload));
  } catch {}
};

// ----------- EXPORT HOOK -----------
export const useAuth = () => {
  const [usuario, setUsuario] = useState<UsuarioPerfil | null>(null);

  useEffect(() => {
    const inicializarUsuario = async (): Promise<void> => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const cache = obtenerCacheAuth();
      const cacheVigente =
        cache &&
        cache.userId === user.id &&
        Date.now() - cache.savedAt < AUTH_CACHE_TTL_MS;

      if (cacheVigente) {
        setUsuario({
          id: user.id,
          email: user.email ?? undefined,
          nombre: cache.nombre,
          username: cache.username,
          avatarUrl: cache.avatarUrl ?? null,
        });
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .maybeSingle();

      const usernamePerfil =
        typeof profileData?.username === "string"
          ? profileData.username
          : undefined;

      const nombreUsuario =
        (user.user_metadata?.display_name as string) ||
        (user.user_metadata?.username as string) ||
        usernamePerfil ||
        (user.user_metadata?.full_name as string) ||
        (user.user_metadata?.name as string) ||
        user.email?.split("@")[0];

      const avatarUsuario =
        pickAvatarFromMetadata(user.user_metadata as Record<string, unknown>);

      setUsuario({
        id: user.id,
        email: user.email ?? undefined,
        nombre: nombreUsuario,
        username: usernamePerfil,
        avatarUrl: avatarUsuario,
      });

      guardarCacheAuth({
        userId: user.id,
        savedAt: Date.now(),
        nombre: nombreUsuario,
        username: usernamePerfil,
        avatarUrl: avatarUsuario,
      });
    };

    inicializarUsuario();
  }, []);

  return {
    usuario,
    setUsuario,
    cerrarSesion,
  };
};
