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

// ----------- FUNCIONES -----------
const cerrarSesion = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error al cerrar sesion:", error.message);
    alert("No se pudo cerrar sesion. Intentalo de nuevo.");
    return;
  }

  window.location.href = "/login";
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
    };

    inicializarUsuario();
  }, []);

  return {
    usuario,
    setUsuario,
    cerrarSesion,
  };
};
