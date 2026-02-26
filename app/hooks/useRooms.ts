// ----------- IMPORTS -----------
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { Sala } from "../types/database";
import { generarCodigoSala } from "../lib/utils";

// ----------- TIPOS -----------
type PerfilCache = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

type PerfilConTimestamp = {
  perfil: PerfilCache;
  fetchedAt: number;
};

type RoomsLocalCache = {
  version: 1;
  savedAt: number;
  salas: Sala[];
  idSalaActiva: string | null;
  perfiles: Record<string, PerfilConTimestamp>;
};

// ----------- CONSTANTES -----------
const PERFIL_TTL_MS = 5 * 60 * 1000;
const ROOMS_CACHE_TTL_MS = 60 * 1000;
const ROOMS_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

// ----------- FUNCIONES -----------
const cacheKeySalas = (usuarioId: string): string =>
  `textly:rooms-cache:${usuarioId}`;

const leerCacheSalas = (usuarioId: string): RoomsLocalCache | null => {
  try {
    const raw = localStorage.getItem(cacheKeySalas(usuarioId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RoomsLocalCache;
    if (!parsed || parsed.version !== 1) return null;
    if (Date.now() - parsed.savedAt > ROOMS_CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
};

const recortarPerfilesCache = (
  perfiles: Record<string, PerfilConTimestamp>,
): Record<string, PerfilConTimestamp> => {
  const entries = Object.entries(perfiles);
  if (entries.length <= 120) return perfiles;

  const ordenados = entries
    .sort((a, b) => b[1].fetchedAt - a[1].fetchedAt)
    .slice(0, 120);
  return Object.fromEntries(ordenados);
};

const guardarCacheSalas = (
  usuarioId: string,
  payload: Omit<RoomsLocalCache, "version" | "savedAt">,
): void => {
  try {
    localStorage.setItem(
      cacheKeySalas(usuarioId),
      JSON.stringify({
        version: 1,
        savedAt: Date.now(),
        salas: payload.salas,
        idSalaActiva: payload.idSalaActiva,
        perfiles: recortarPerfilesCache(payload.perfiles),
      } satisfies RoomsLocalCache),
    );
  } catch {}
};

const cargarPerfilesDesdeAPI = async (
  ids: string[],
): Promise<PerfilCache[]> => {
  try {
    const res = await fetch("/api/users/meta", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });

    if (!res.ok) return [];

    const data = await res.json();
    return Array.isArray(data?.users) ? (data.users as PerfilCache[]) : [];
  } catch (error) {
    console.error("Error al cargar perfiles:", error);
    return [];
  }
};

const obtenerIdsFaltantes = (
  ids: string[],
  cache: Record<string, PerfilConTimestamp>,
  enCurso: Set<string>,
): string[] => {
  const now = Date.now();
  const idsUnicos = [...new Set(ids.filter(Boolean))];

  return idsUnicos.filter((id) => {
    if (enCurso.has(id)) return false;
    const cached = cache[id];
    if (!cached) return true;
    return now - cached.fetchedAt > PERFIL_TTL_MS;
  });
};

// ----------- EXPORT HOOK -----------
export const useRooms = (usuarioId: string | undefined) => {
  const [salas, setSalas] = useState<Sala[]>([]);
  const [idSalaActiva, setIdSalaActiva] = useState<string | null>(null);
  const [perfiles, setPerfiles] = useState<Record<string, PerfilCache>>({});
  const [errorSalaEliminada, setErrorSalaEliminada] = useState<string | null>(
    null,
  );

  const cachePerfilesRef = useRef<Record<string, PerfilConTimestamp>>({});
  const enCursoPerfilesRef = useRef<Set<string>>(new Set());

  const agregarPerfiles = (lista: PerfilCache[]): void => {
    if (!lista.length) return;

    const now = Date.now();
    lista.forEach((p) => {
      if (!p?.id) return;
      cachePerfilesRef.current[p.id] = { perfil: p, fetchedAt: now };
    });

    setPerfiles((prev) => {
      const next = { ...prev };
      lista.forEach((p) => {
        if (!p?.id) return;
        next[p.id] = p;
      });
      return next;
    });
  };

  const cargarPerfiles = useCallback(async (ids: string[]): Promise<void> => {
    const faltantes = obtenerIdsFaltantes(
      ids,
      cachePerfilesRef.current,
      enCursoPerfilesRef.current,
    );
    if (!faltantes.length) return;

    faltantes.forEach((id) => enCursoPerfilesRef.current.add(id));

    try {
      const perfilesCargados = await cargarPerfilesDesdeAPI(faltantes);
      if (perfilesCargados.length) {
        agregarPerfiles(perfilesCargados);
      }
    } finally {
      faltantes.forEach((id) => enCursoPerfilesRef.current.delete(id));
    }
  }, []);

  const validarSalaActiva = async (): Promise<Sala | null> => {
    if (!idSalaActiva) return null;

    const { data, error } = await supabase
      .from("rooms")
      .select("id")
      .eq("id", idSalaActiva)
      .maybeSingle();

    if (error || !data) {
      setErrorSalaEliminada("Este chat fue eliminado.");
      setIdSalaActiva(null);
      setSalas((prev) => prev.filter((s) => s.id !== idSalaActiva));
      return null;
    }

    return data as Sala;
  };

  const crearSala = async (nombreSala: string): Promise<void> => {
    if (!usuarioId) {
      console.error("No hay usuario autenticado para crear sala.");
      return;
    }

    const nuevoCodigo = generarCodigoSala();

    const { data, error } = await supabase
      .from("rooms")
      .insert([
        {
          participant_1: usuarioId,
          room_name: nombreSala.trim() || null,
          share_code: nuevoCodigo,
        },
      ])
      .select()
      .maybeSingle();

    if (error) {
      console.error("Error al crear sala:", {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      });
      alert("No se pudo crear la sala. Intentalo de nuevo.");
      return;
    }

    if (data) {
      setSalas((prev) => [data, ...prev]);
      setIdSalaActiva(data.id);
    }
  };

  const unirseASala = async (
    codigo: string,
  ): Promise<{ success?: boolean; error?: string }> => {
    if (!usuarioId || !codigo) return { error: "Faltan datos" };

    const { data: sala, error: errorBuscar } = await supabase
      .from("rooms")
      .select("*")
      .eq("share_code", codigo.trim().toUpperCase())
      .maybeSingle();

    if (errorBuscar || !sala) return { error: "La sala no existe." };
    if (sala.participant_1 === usuarioId)
      return { error: "Ya eres el creador de esta sala." };
    if (sala.participant_2) return { error: "La sala ya esta completa." };

    const { error: errorUpdate } = await supabase
      .from("rooms")
      .update({ participant_2: usuarioId })
      .eq("id", sala.id);

    if (errorUpdate) return { error: "No pudiste unirte." };

    const salaActualizada = { ...sala, participant_2: usuarioId };
    setSalas((prev) => [salaActualizada, ...prev]);
    setIdSalaActiva(sala.id);
    return { success: true };
  };

  const eliminarSala = async (id: string): Promise<void> => {
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    if (!error) {
      setSalas((prev) => prev.filter((s) => s.id !== id));
      if (idSalaActiva === id) {
        setIdSalaActiva(null);
      }
    }
  };

  useEffect(() => {
    if (!usuarioId) return;

    const cache = leerCacheSalas(usuarioId);
    if (cache) {
      setSalas(cache.salas || []);
      setIdSalaActiva(cache.idSalaActiva || null);
      cachePerfilesRef.current = cache.perfiles || {};
      setPerfiles(
        Object.fromEntries(
          Object.entries(cache.perfiles || {}).map(([id, value]) => [
            id,
            value.perfil,
          ]),
        ),
      );
      const idsParticipantesCache = (cache.salas || []).flatMap((s) =>
        [s.participant_1, s.participant_2].filter((id): id is string =>
          Boolean(id),
        ),
      );
      void cargarPerfiles(idsParticipantesCache);
    }

    const cacheReciente =
      cache && Date.now() - cache.savedAt < ROOMS_CACHE_TTL_MS;
    if (cacheReciente) return;

    const cargarSalas = async (): Promise<void> => {
      const { data } = await supabase
        .from("rooms")
        .select("*")
        .or(`participant_1.eq.${usuarioId},participant_2.eq.${usuarioId}`)
        .order("created_at", { ascending: false });

      if (data) {
        setSalas(data);
        setIdSalaActiva((prev) => {
          if (!prev) return prev;
          return data.some((s) => s.id === prev) ? prev : null;
        });

        const idsParticipantes = data.flatMap((s) =>
          [s.participant_1, s.participant_2].filter((id): id is string =>
            Boolean(id),
          ),
        );
        await cargarPerfiles(idsParticipantes);
      }
    };

    cargarSalas();
  }, [usuarioId, cargarPerfiles]);

  useEffect(() => {
    if (!usuarioId || !idSalaActiva) return;

    const salaActiva = salas.find((s) => s.id === idSalaActiva);
    if (!salaActiva) return;

    const idOtroParticipante =
      salaActiva.participant_1 === usuarioId
        ? salaActiva.participant_2
        : salaActiva.participant_1;

    if (!idOtroParticipante) return;
    void cargarPerfiles([idOtroParticipante]);
  }, [usuarioId, idSalaActiva, salas, cargarPerfiles]);

  useEffect(() => {
    if (!usuarioId) return;
    guardarCacheSalas(usuarioId, {
      salas,
      idSalaActiva,
      perfiles: cachePerfilesRef.current,
    });
  }, [usuarioId, salas, idSalaActiva, perfiles]);

  useEffect(() => {
    if (!idSalaActiva || !usuarioId) return;

    const canalSalaEliminada = supabase
      .channel(`room-delete-${idSalaActiva}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${idSalaActiva}`,
        },
        () => {
          setErrorSalaEliminada("Este chat fue eliminado.");
          setIdSalaActiva(null);
          setSalas((prev) => prev.filter((s) => s.id !== idSalaActiva));
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalSalaEliminada);
    };
  }, [idSalaActiva, usuarioId]);

  return {
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
  };
};
