// ----------- IMPORTS -----------
import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  TranslationLanguage,
  UserSettings,
  WritingMode,
} from "../types/database";
import { useAuth } from "./useAuth";
import { useMensajes } from "./useMensajes";
import { useRooms } from "./useRooms";

// ----------- TIPOS -----------
export type PerfilChat = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

type UpdateUserSettingsInput = {
  assistant_enabled?: boolean;
  writing_mode?: WritingMode;
  translation_language?: TranslationLanguage;
};

type ImproveAction = "improve" | "translate";

const DEFAULT_CONFIG_IA = {
  assistant_enabled: true,
  writing_mode: "informal" as WritingMode,
  translation_language: "es" as TranslationLanguage,
};

const buildDefaultUserSettings = (userId: string): UserSettings => ({
  user_id: userId,
  assistant_enabled: true,
  writing_mode: "informal",
  translation_language: "es",
  created_at: "",
  updated_at: "",
});

// ----------- FUNCIONES -----------
const ejecutarAccionIA = async (
  texto: string,
  action: ImproveAction,
): Promise<string | null> => {
  const res = await fetch("/api/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: texto, action }),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data?.details || data?.error || "No se pudo procesar con IA.");
    return null;
  }

  return data.outputText?.trim() || null;
};

// ----------- EXPORT HOOK -----------
export const useChat = () => {
  // ----------- ESTADOS DE UI -----------
  const [cargando, setCargando] = useState(true);
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);
  const [accionIAEnCurso, setAccionIAEnCurso] = useState<ImproveAction | null>(null);
  const [cargandoConfigIA, setCargandoConfigIA] = useState(true);
  const [guardandoConfigIA, setGuardandoConfigIA] = useState(false);
  const [configIA, setConfigIA] = useState<UserSettings | null>(null);

  // ----------- HOOKS COMPUESTOS -----------
  const { usuario, cerrarSesion } = useAuth();
  const {
    salas,
    idSalaActiva,
    setIdSalaActiva,
    perfiles,
    errorSalaEliminada,
    crearSala,
    unirseASala,
    eliminarSala,
    cargarPerfiles,
    validarSalaActiva,
  } = useRooms(usuario?.id);
  const { mensajes, enviarMensaje, setMensajes, limpiarCacheSala } = useMensajes(
    idSalaActiva,
    usuario?.id,
    validarSalaActiva,
    (error) => {
      setMensajes([]);
      alert(error + " La pagina se actualizara.");
      window.location.reload();
    },
    cargarPerfiles,
  );

  // ----------- FUNCIONES -----------
  const cargarConfigIA = useCallback(async (): Promise<void> => {
    if (!usuario?.id) {
      setConfigIA(null);
      setCargandoConfigIA(false);
      return;
    }

    setCargandoConfigIA(true);
    try {
      const { data: dataRaw, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", usuario.id)
        .maybeSingle();

      if (error) {
        console.error("Error cargando user_settings:", error.message);
        setConfigIA(buildDefaultUserSettings(usuario.id));
        return;
      }

      const data = dataRaw as UserSettings | null;

      if (!data) {
        setConfigIA(buildDefaultUserSettings(usuario.id));
        return;
      }

      setConfigIA(data);
    } finally {
      setCargandoConfigIA(false);
    }
  }, [usuario?.id]);

  const actualizarConfigIA = async (
    configParcial: UpdateUserSettingsInput,
  ): Promise<void> => {
    if (!usuario?.id) return;

    setGuardandoConfigIA(true);
    try {
      const payload = {
        user_id: usuario.id,
        ...configParcial,
      };

      const { data: dataRaw, error } = await supabase
        .from("user_settings")
        .upsert(payload, { onConflict: "user_id" })
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Error guardando user_settings:", error.message);
        alert("No se pudo guardar la configuracion de IA.");
        throw new Error(error.message);
      }

      const data = dataRaw as UserSettings | null;

      if (data) {
        setConfigIA(data);
      } else {
        await cargarConfigIA();
      }
    } finally {
      setGuardandoConfigIA(false);
    }
  };

  // Maneja el envio del formulario de mensaje
  const handleEnviarMensaje = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    await enviarMensaje(nuevoMensaje);
    setNuevoMensaje("");
  };

  const ejecutarTransformacionIA = async (action: ImproveAction): Promise<void> => {
    if (!nuevoMensaje.trim() || !idSalaActiva) return;
    if (!configIA?.assistant_enabled) return;

    const salaValida = await validarSalaActiva();
    if (!salaValida) return;

    setAccionIAEnCurso(action);
    setCargandoIA(true);
    try {
      const salida = await ejecutarAccionIA(nuevoMensaje, action);
      if (salida) {
        setNuevoMensaje(salida);
      }
    } finally {
      setCargandoIA(false);
      setAccionIAEnCurso(null);
    }
  };

  const mejorarMensajeIA = async (): Promise<void> => {
    await ejecutarTransformacionIA("improve");
  };

  const traducirMensajeIA = async (): Promise<void> => {
    await ejecutarTransformacionIA("translate");
  };

  // Elimina la sala y limpia el estado
  const handleEliminarSala = async (id: string): Promise<void> => {
    await eliminarSala(id);
    limpiarCacheSala(id);
    if (idSalaActiva === id) {
      setMensajes([]);
    }
  };

  // ----------- EFFECTS -----------
  useEffect(() => {
    const ejecutarCarga = async (): Promise<void> => {
      await cargarConfigIA();
    };

    void ejecutarCarga();
  }, [cargarConfigIA]);

  // Effect para marcar como cargado cuando el usuario esté listo
  useEffect(() => {
    if (usuario !== undefined && !cargandoConfigIA) {
      setCargando(false);
    }
  }, [usuario, cargandoConfigIA]);

  // Effect para manejar error de sala eliminada
  useEffect(() => {
    if (!errorSalaEliminada) return;
    alert(errorSalaEliminada + " La pagina se actualizara.");
    window.location.reload();
  }, [errorSalaEliminada]);

  // ----------- RETORNO -----------
  return {
    // Estados
    cargando,
    // Usuario
    usuario,
    cerrarSesion,
    // Salas
    salas,
    idSalaActiva,
    setIdSalaActiva,
    crearSala,
    unirseASala,
    eliminarSala: handleEliminarSala,
    // Mensajes
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    enviarMensaje: handleEnviarMensaje,
    // IA
    cargandoIA,
    accionIAEnCurso,
    mejorarMensajeIA,
    traducirMensajeIA,
    configIA: configIA || (usuario?.id ? buildDefaultUserSettings(usuario.id) : null),
    asistenteIAActivo: configIA?.assistant_enabled ?? DEFAULT_CONFIG_IA.assistant_enabled,
    cargandoConfigIA,
    guardandoConfigIA,
    actualizarConfigIA,
    // Perfiles
    perfiles,
    // Errores
    errorSalaEliminada,
  };
};
