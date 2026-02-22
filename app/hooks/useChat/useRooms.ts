"use client";

import { useState, useEffect, useCallback } from "react";

import { supabase } from "../../lib/supabaseClient";
import { roomsService } from "../../services/roomsService";
import type { Sala } from "../../types/database";
import type { PerfilLoader } from "./types";

// ============================================
// HOOK DE SALAS
// ============================================

interface UseRoomsProps {
  userId: string | undefined;
  cargarPerfiles: PerfilLoader;
}

// ============================================
// HOOK
// ============================================

export function useRooms({ userId, cargarPerfiles }: UseRoomsProps) {
  // ============================================
  // ESTADOS
  // ============================================

  // Lista de salas/chats del usuario
  const [salas, setSalas] = useState<Sala[]>([]);

  // ID de la sala actualmente activa
  const [idSalaActiva, setIdSalaActiva] = useState<string | null>(null);

  // ============================================
  // FUNCIONES
  // ============================================

  // Carga las salas del usuario
  const cargarSalas = useCallback(async () => {
    if (!userId) return [];
    const salasData = await roomsService.getRoomsByUser(userId);
    setSalas(salasData);
    return salasData;
  }, [userId]);

  // Elimina una sala
  const eliminarSala = async (idSala: string) => {
    await roomsService.deleteRoom(idSala);
    setSalas((prev) => {
      const restantes = prev.filter((sala) => sala.id !== idSala);
      if (idSalaActiva === idSala) {
        setIdSalaActiva(restantes[0]?.id ?? null);
      }
      return restantes;
    });
  };

  // Selecciona una sala y la marca como activa
  const seleccionarSala = (id: string) => {
    setIdSalaActiva(id);
  };

  // Agrega una sala al estado
  const agregarSala = (nuevaSala: Sala) => {
    setSalas((prev) =>
      prev.some((sala) => sala.id === nuevaSala.id) ? prev : [nuevaSala, ...prev],
    );
    setIdSalaActiva((prev) => prev ?? nuevaSala.id);
  };

  // ============================================
  // EFECTOS
  // ============================================

  // Carga inicial de salas
  useEffect(() => {
    if (userId) {
      cargarSalas();
    }
  }, [userId, cargarSalas]);

  // Suscripcion a nuevas salas en tiempo real
  useEffect(() => {
    if (!userId) return;

    const canalRooms = supabase
      .channel(`rooms-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rooms" },
        (payload) => {
          const nuevaSala = payload.new as Sala;
          const participa = nuevaSala.participant_1 === userId || nuevaSala.participant_2 === userId;
          if (!participa) return;

          agregarSala(nuevaSala);

          const idContacto = nuevaSala.participant_1 === userId ? nuevaSala.participant_2 : nuevaSala.participant_1;
          void cargarPerfiles([idContacto]);
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(canalRooms);
    };
  }, [userId, cargarPerfiles]);

  // ============================================
  // RETORNO
  // ============================================

  return {
    salas,
    setSalas,
    idSalaActiva,
    setIdSalaActiva,
    cargarSalas,
    eliminarSala,
    seleccionarSala,
    agregarSala,
  };
}
