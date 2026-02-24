// ----------- IMPORTS -----------
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { useRooms } from "./useRooms";
import { useMensajes } from "./useMensajes";

// ----------- TIPOS -----------
export type PerfilChat = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

// ----------- VARIABLES CONSTANTES -----------
// (sin constantes en este archivo)

// ----------- FUNCIONES -----------

// Mejora el texto del mensaje usando IA (Gemini)
const mejorarConIA = async (texto: string): Promise<string | null> => {
  const res = await fetch("/api/improve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: texto }),
  });

  const data = await res.json();
  if (!res.ok) {
    alert(data?.details || data?.error || "No se pudo mejorar el mensaje.");
    return null;
  }

  return data.improvedText?.trim() || null;
};

// ----------- EXPORT HOOK -----------
export const useChat = () => {
  // ----------- ESTADOS DE UI -----------
  const [nuevoMensaje, setNuevoMensaje] = useState("");
  const [cargandoIA, setCargandoIA] = useState(false);

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
      alert(error + " La página se actualizará.");
      window.location.reload();
    },
    cargarPerfiles
  );

  // ----------- FUNCIONES -----------

  // Maneja el envío del formulario de mensaje
  const handleEnviarMensaje = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    if (!nuevoMensaje.trim()) return;

    await enviarMensaje(nuevoMensaje);
    setNuevoMensaje("");
  };

  // Mejora el mensaje actual con IA
  const mejorarMensajeIA = async (): Promise<void> => {
    if (!nuevoMensaje.trim() || !idSalaActiva) return;

    const salaValida = await validarSalaActiva();
    if (!salaValida) return;

    setCargandoIA(true);
    try {
      const mejorado = await mejorarConIA(nuevoMensaje);
      if (mejorado) {
        setNuevoMensaje(mejorado);
      }
    } finally {
      setCargandoIA(false);
    }
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

  // Effect para manejar error de sala eliminada
  useEffect(() => {
    if (!errorSalaEliminada) return;
    alert(errorSalaEliminada + " La página se actualizará.");
    window.location.reload();
  }, [errorSalaEliminada]);

  // ----------- RETORNO -----------
  return {
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
    mejorarMensajeIA,
    // Perfiles
    perfiles,
    // Errores
    errorSalaEliminada,
  };
};
