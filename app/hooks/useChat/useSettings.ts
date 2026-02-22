"use client";

import { useState, useEffect, useCallback } from "react";

import { settingsService } from "../../services/settingsService";
import type { ConfigIA, ModoRedaccion, IdiomaIA } from "./types";

// ============================================
// HOOK DE CONFIGURACION
// ============================================

interface UseSettingsProps {
  userId: string | undefined;
}

// ============================================
// HOOK
// ============================================

export function useSettings({ userId }: UseSettingsProps) {
  // ============================================
  // ESTADOS
  // ============================================

  // Configuracion de IA
  const [configIA, setConfigIA] = useState<ConfigIA>({
    asistenteActivo: true,
    modoRedaccion: "informal",
    idioma: "es",
  });

  // Indicador de carga
  const [cargandoConfig, setCargandoConfig] = useState(false);

  // ============================================
  // FUNCIONES
  // ============================================

  // Carga la configuracion del usuario
  const cargarConfiguracion = useCallback(async () => {
    if (!userId) return;

    setCargandoConfig(true);
    try {
      const settings = await settingsService.getOrCreateSettings(userId);
      if (settings) {
        setConfigIA({
          asistenteActivo: settings.assistant_enabled,
          modoRedaccion: settings.writing_mode,
          idioma: settings.language,
        });
      }
    } catch (error) {
      console.error("Error cargando configuracion:", error);
    } finally {
      setCargandoConfig(false);
    }
  }, [userId]);

  // Actualiza la configuracion
  const actualizarConfigIA = useCallback(async (nuevaConfig: Partial<ConfigIA>) => {
    if (!userId) return;

    // Actualizar optimistically en el estado
    setConfigIA((prev) => ({ ...prev, ...nuevaConfig }));

    // Guardar en la base de datos
    const settingsToUpdate: {
      assistant_enabled?: boolean;
      writing_mode?: ModoRedaccion;
      language?: IdiomaIA;
    } = {};

    if (nuevaConfig.asistenteActivo !== undefined) {
      settingsToUpdate.assistant_enabled = nuevaConfig.asistenteActivo;
    }
    if (nuevaConfig.modoRedaccion !== undefined) {
      settingsToUpdate.writing_mode = nuevaConfig.modoRedaccion;
    }
    if (nuevaConfig.idioma !== undefined) {
      settingsToUpdate.language = nuevaConfig.idioma;
    }

    await settingsService.updateSettings(userId, settingsToUpdate);
  }, [userId]);

  // ============================================
  // EFECTOS
  // ============================================

  // Carga inicial de configuracion
  useEffect(() => {
    if (userId) {
      cargarConfiguracion();
    }
  }, [userId, cargarConfiguracion]);

  // ============================================
  // RETORNO
  // ============================================

  return {
    configIA,
    cargandoConfig,
    actualizarConfigIA,
  };
}
