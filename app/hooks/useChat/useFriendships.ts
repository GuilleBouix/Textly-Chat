"use client";

import { useState, useEffect, useCallback } from "react";

import { supabase } from "../../lib/supabaseClient";
import { debug, debugError } from "../../lib/debug";
import { friendshipsService } from "../../services/friendshipsService";
import { roomsService } from "../../services/roomsService";
import { authService } from "../../services/authService";
import type { Sala } from "../../types/database";
import type { SolicitudPendiente } from "../../types/chat";
import type { PerfilLoader } from "./types";

// ============================================
// HOOK DE AMISTADES
// ============================================

interface UseFriendshipsProps {
  userId: string | undefined;
  setSalas: React.Dispatch<React.SetStateAction<Sala[]>>;
  setIdSalaActiva: (id: string) => void;
  cargarPerfiles: PerfilLoader;
}

// ============================================
// HOOK
// ============================================

export function useFriendships({
  userId,
  setSalas,
  setIdSalaActiva,
  cargarPerfiles,
}: UseFriendshipsProps) {
  // ============================================
  // ESTADOS
  // ============================================

  // Solicitudes de amistad recibidas pendientes
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<SolicitudPendiente[]>([]);

  // Solicitudes de amistad enviadas pendientes
  const [solicitudesEnviadas, setSolicitudesEnviadas] = useState<SolicitudPendiente[]>([]);

  // ============================================
  // FUNCIONES
  // ============================================

  // Carga las solicitudes de amistad
  const cargarSolicitudes = useCallback(async () => {
    if (!userId) return;

    const recibidas = await friendshipsService.getPendingReceived(userId);
    const enviadas = await friendshipsService.getPendingSent(userId);

    setSolicitudesPendientes(recibidas);
    setSolicitudesEnviadas(enviadas);

    const idsEmisores = recibidas.map((item) => item.sender_id);
    const idsReceptores = enviadas.map((item) => item.receiver_id);
    await cargarPerfiles([...idsEmisores, ...idsReceptores]);
  }, [userId, cargarPerfiles]);

  // Agrega un amigo/envia solicitud
  const agregarAmigo = async (amigoId: string) => {
    if (!userId) return;

    debug("agregarAmigo:start", { usuarioId: userId, amigoId });

    if (amigoId === userId) {
      debug("agregarAmigo:skip", { reason: "self-friendship" });
      return;
    }

    await authService.getSession();
    await authService.getUser();

    const amistadExistente = await friendshipsService.findFriendship(userId, amigoId);

    if (amistadExistente) {
      debug("friendships.maybeSingle:ok", {
        found: true,
        friendshipId: amistadExistente.id,
        status: amistadExistente.status,
      });

      if (amistadExistente.status === "accepted") {
        const salaExistente = await roomsService.findRoomByParticipants(userId, amigoId);
        if (salaExistente) {
          setIdSalaActiva(salaExistente.id);
          await cargarPerfiles([amigoId]);
          debug("agregarAmigo:end", { action: "open-existing-room" });
          return;
        }
      }

      if (amistadExistente.status === "pending") {
        await cargarSolicitudes();
      }
      debug("agregarAmigo:end", { action: "friendship-already-exists" });
      return;
    }

    const payload = { sender_id: userId, receiver_id: amigoId, status: "pending" as const };
    debug("friendships.insert:payload", payload);

    const insertedFriendship = await friendshipsService.createFriendship(userId, amigoId);

    if (!insertedFriendship) {
      throw new Error("Failed to create friendship");
    }

    setSolicitudesEnviadas((prev) =>
      prev.some((item) => item.id === insertedFriendship.id)
        ? prev
        : [insertedFriendship as unknown as SolicitudPendiente, ...prev],
    );
    await cargarPerfiles([amigoId]);
    await cargarSolicitudes();
    debug("friendships.insert:ok");
    debug("agregarAmigo:end", { action: "request-sent" });
  };

  // Acepta una solicitud de amistad
  const aceptarSolicitud = async (solicitudId: string, emisorId: string) => {
    if (!userId) return;

    debug("aceptarSolicitud:start", { solicitudId, emisorId, receptorId: userId });

    const success = await friendshipsService.acceptFriendship(solicitudId, userId);
    if (!success) {
      throw new Error("Failed to accept friendship");
    }

    const room = await roomsService.createRoom(userId, emisorId);

    if (!room) {
      const fallbackRoom = await roomsService.findRoomByParticipants(userId, emisorId);
      if (fallbackRoom) {
        setSalas((prev) =>
          prev.some((sala) => sala.id === fallbackRoom.id) ? prev : [fallbackRoom, ...prev],
        );
        setIdSalaActiva(fallbackRoom.id);
      }
    } else {
      setSalas((prev) =>
        prev.some((sala) => sala.id === room.id) ? prev : [room, ...prev],
      );
      setIdSalaActiva(room.id);
    }

    setSolicitudesPendientes((prev) =>
      prev.filter((solicitud) => solicitud.id !== solicitudId),
    );
    await cargarPerfiles([emisorId]);
    debug("aceptarSolicitud:end");
  };

  // Cancela una solicitud de amistad enviada
  const cancelarSolicitud = async (solicitudId: string) => {
    if (!userId) return;

    const success = await friendshipsService.deleteFriendship(solicitudId, userId);
    if (!success) {
      const customError = new Error("No se pudo cancelar la solicitud (sin permisos o ya no existe).");
      debugError("friendships.delete.pending.no-row", customError);
      throw customError;
    }

    setSolicitudesEnviadas((prev) =>
      prev.filter((solicitud) => solicitud.id !== solicitudId),
    );
  };

  // ============================================
  // EFECTOS
  // ============================================

  // Carga inicial de solicitudes
  useEffect(() => {
    if (userId) {
      cargarSolicitudes();
    }
  }, [userId, cargarSolicitudes]);

  // Suscripcion a cambios en amistades
  useEffect(() => {
    if (!userId) return;

    const channel = friendshipsService.subscribeToFriendships(userId, {
      onInsert: (nueva) => {
        if (nueva.status !== "pending") return;

        if (nueva.receiver_id === userId) {
          setSolicitudesPendientes((prev) =>
            prev.some((item) => item.id === nueva.id)
              ? prev
              : [nueva as unknown as SolicitudPendiente, ...prev],
          );
          void cargarPerfiles([nueva.sender_id]);
        }

        if (nueva.sender_id === userId) {
          setSolicitudesEnviadas((prev) =>
            prev.some((item) => item.id === nueva.id)
              ? prev
              : [nueva as unknown as SolicitudPendiente, ...prev],
          );
          void cargarPerfiles([nueva.receiver_id]);
        }
      },
      onUpdate: (actualizada) => {
        if (actualizada.receiver_id === userId) {
          setSolicitudesPendientes((prev) => {
            if (actualizada.status !== "pending") {
              return prev.filter((item) => item.id !== actualizada.id);
            }
            return prev.some((item) => item.id === actualizada.id)
              ? prev
              : [actualizada as unknown as SolicitudPendiente, ...prev];
          });
        }

        if (actualizada.sender_id === userId) {
          setSolicitudesEnviadas((prev) => {
            if (actualizada.status !== "pending") {
              return prev.filter((item) => item.id !== actualizada.id);
            }
            return prev.some((item) => item.id === actualizada.id)
              ? prev
              : [actualizada as unknown as SolicitudPendiente, ...prev];
          });
        }
      },
      onDelete: (eliminada) => {
        if (eliminada.sender_id === userId) {
          setSolicitudesEnviadas((prev) =>
            prev.filter((item) => item.id !== eliminada.id),
          );
        }
        if (eliminada.receiver_id === userId) {
          setSolicitudesPendientes((prev) =>
            prev.filter((item) => item.id !== eliminada.id),
          );
        }
      },
    });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, cargarPerfiles]);

  // ============================================
  // RETORNO
  // ============================================

  return {
    solicitudesPendientes,
    solicitudesEnviadas,
    setSolicitudesPendientes,
    setSolicitudesEnviadas,
    cargarSolicitudes,
    agregarAmigo,
    aceptarSolicitud,
    cancelarSolicitud,
  };
}
