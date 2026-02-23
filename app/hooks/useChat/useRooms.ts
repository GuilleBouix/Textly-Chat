"use client";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { roomsService } from "../../services/roomsService";
import type { Sala } from "../../types/database";
import type { PerfilLoader } from "./types";
import { localCache } from "../../lib/localCache";

// ============================================
// HOOK DE SALAS
// ============================================

interface UseRoomsProps {
  userId: string | undefined;
  cargarPerfiles: PerfilLoader;
}

const CACHE_SALAS_MS = 1000 * 60 * 60 * 24;
const getSalasCacheKey = (uid: string) => `textly:rooms:${uid}`;

// ============================================
// HOOK
// ============================================

export function useRooms({ userId, cargarPerfiles }: UseRoomsProps) {
  const [cacheHidratada, setCacheHidratada] = useState(false);

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
    localCache.write(getSalasCacheKey(userId), salasData);
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
      prev.some((sala) => sala.id === nuevaSala.id)
        ? prev
        : [nuevaSala, ...prev],
    );
    setIdSalaActiva((prev) => prev ?? nuevaSala.id);
  };

  // ============================================
  // EFECTOS
  // ============================================

  // Carga inicial de salas
  useEffect(() => {
    if (!userId) {
      setSalas([]);
      setIdSalaActiva(null);
      setCacheHidratada(false);
      return;
    }

    const cache = localCache.read<Sala[]>(
      getSalasCacheKey(userId),
      CACHE_SALAS_MS,
    );
    if (cache) {
      setSalas(cache);
      setIdSalaActiva((prev) => prev ?? cache[0]?.id ?? null);
    }
    setCacheHidratada(true);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      void cargarSalas();
    }
  }, [userId, cargarSalas]);

  useEffect(() => {
    if (!userId || !cacheHidratada) return;
    localCache.write(getSalasCacheKey(userId), salas);
  }, [userId, salas, cacheHidratada]);

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
          const participa =
            nuevaSala.participant_1 === userId ||
            nuevaSala.participant_2 === userId;
          if (!participa) return;

          agregarSala(nuevaSala);

          const idContacto =
            nuevaSala.participant_1 === userId
              ? nuevaSala.participant_2
              : nuevaSala.participant_1;
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
