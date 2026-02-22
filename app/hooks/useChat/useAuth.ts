"use client";
import { useState, useEffect } from "react";
import { authService } from "../../services/authService";
import type { UsuarioSupabase } from "../../types/database";

// ============================================
// HOOK DE AUTENTICACION
// ============================================

export function useAuth() {
  // ============================================
  // ESTADOS
  // ============================================

  // Usuario actualmente autenticado
  const [usuario, setUsuario] = useState<UsuarioSupabase | null>(null);

  // ============================================
  // EFECTOS
  // ============================================

  // Inicializacion al cargar el hook
  useEffect(() => {
    const inicializar = async () => {
      const user = await authService.getCurrentUser();
      setUsuario(user);
    };
    inicializar();
  }, []);

  // ============================================
  // FUNCIONES
  // ============================================

  // Cierra la sesion del usuario
  const cerrarSesion = async () => {
    await authService.signOut();
    window.location.href = "/login";
  };

  // Obtiene el usuario actual
  const obtenerUsuarioActual = async () => {
    return await authService.getCurrentUser();
  };

  // Refresca los datos del usuario
  const refreshUsuario = async () => {
    const user = await authService.getCurrentUser();
    setUsuario(user);
  };

  // ============================================
  // RETORNO
  // ============================================

  return {
    usuario,
    setUsuario,
    cerrarSesion,
    obtenerUsuarioActual,
    refreshUsuario,
  };
}
