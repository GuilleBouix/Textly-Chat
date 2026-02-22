"use client";

import { useState, useEffect, useCallback, useRef } from "react";

import { useAuth } from "./useAuth";
import { useRooms } from "./useRooms";
import { useMessages } from "./useMessages";
import { useFriendships } from "./useFriendships";
import { useProfiles } from "./useProfiles";
import type { UseChatReturn } from "./types";
import type { Sala } from "../../types/database";

// ============================================
// HOOK PRINCIPAL DEL CHAT (ORQUESTADOR)
// ============================================

export function useChat(): UseChatReturn {
  // ============================================
  // REFS
  // ============================================

  // Referencia para evitar inicializacion multiple
  const inicializado = useRef(false);

  // ============================================
  // HOOKS INDIVIDUALES
  // ============================================

  // Hook de autenticacion
  const { usuario, cerrarSesion } = useAuth();

  // Hook de perfiles (se inicializa primero para compartir funciones)
  const { perfiles, cargarPerfilesPublicos, buscarUsuarios, agregarPerfilUsuario } = useProfiles();

  // Hook de salas
  const {
    salas,
    setSalas,
    idSalaActiva,
    setIdSalaActiva,
    cargarSalas,
    eliminarSala,
  } = useRooms({
    userId: usuario?.id,
    cargarPerfiles: cargarPerfilesPublicos,
  });

  // Hook de mensajes
  const {
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    mensajesNoLeidos,
    enviarMensaje,
    marcarChatComoLeido,
  } = useMessages({
    userId: usuario?.id,
    idSalaActiva,
    salas,
    cargarPerfiles: cargarPerfilesPublicos,
  });

  // Hook de amistades
  const {
    solicitudesPendientes,
    solicitudesEnviadas,
    agregarAmigo,
    aceptarSolicitud,
    cancelarSolicitud,
  } = useFriendships({
    userId: usuario?.id,
    setSalas,
    setIdSalaActiva,
    cargarPerfiles: cargarPerfilesPublicos,
  });

  // ============================================
  // ESTADOS ADICIONALES
  // ============================================

  // Estado de carga de IA
  const [cargandoIA, setCargandoIA] = useState(false);

  // ============================================
  // FUNCIONES AUXILIARES
  // ============================================

  // Inicializa el perfil del usuario una sola vez
  const inicializarPerfilUsuario = useCallback(() => {
    if (!usuario || inicializado.current) return;
    inicializado.current = true;

    agregarPerfilUsuario(usuario.id, {
      email: usuario.email || "",
      username:
        (usuario.user_metadata?.full_name as string) ||
        usuario.email?.split("@")[0] ||
        "Yo",
      avatarUrl: (usuario.user_metadata?.avatar_url as string) || null,
    });
  }, [usuario, agregarPerfilUsuario]);

  // Inicializa datos al obtener usuario
  useEffect(() => {
    if (usuario) {
      inicializarPerfilUsuario();

      if (salas.length === 0) {
        cargarSalas().then((salasData) => {
          if (salasData.length) {
            const idsContactos = salasData.map((sala) =>
              sala.participant_1 === usuario.id ? sala.participant_2 : sala.participant_1,
            );
            cargarPerfilesPublicos(idsContactos);
          }
        });
      }
    }
  }, [usuario, inicializarPerfilUsuario, salas.length, cargarSalas, cargarPerfilesPublicos]);

  // Mejora el mensaje con IA
  const mejorarMensajeIA = async () => {
    if (!nuevoMensaje.trim()) return;

    try {
      setCargandoIA(true);
      const res = await fetch("/api/improve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: nuevoMensaje }),
      });

      const body = await res.json();
      if (res.ok && body?.improvedText) {
        setNuevoMensaje(body.improvedText);
      }
    } finally {
      setCargandoIA(false);
    }
  };

  // Alias para compatibilidad
  const buscarPorUsername = buscarUsuarios;
  const enviarSolicitudAmistad = agregarAmigo;

  // ============================================
  // RETORNO (compatibilidad con useChat original)
  // ============================================

  return {
    usuario,
    salas,
    idSalaActiva,
    setIdSalaActiva,
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    perfiles,
    solicitudesPendientes,
    solicitudesEnviadas,
    mensajesNoLeidos,
    cargandoIA,
    enviarMensaje,
    eliminarSala,
    mejorarMensajeIA,
    cerrarSesion,
    buscarUsuarios,
    agregarAmigo,
    buscarPorUsername,
    enviarSolicitudAmistad,
    aceptarSolicitud,
    cancelarSolicitud,
    marcarChatComoLeido,
  };
}
