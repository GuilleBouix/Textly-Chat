// ---------------- TIPOS ----------------
type EntradaCache<T> = {
  version: 1;
  guardadoEn: number;
  ttlMs: number;
  datos: T;
};

type ResultadoLecturaCache<T> = {
  valido: boolean;
  datos: T | null;
};

// ---------------- CONSTANTES ----------------
const VERSION_CACHE = 1;

// ---------------- FUNCIONES ----------------
// Verifica si el entorno actual permite usar localStorage de forma segura
const puedeUsarStorage = (): boolean => {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
};

// Elimina una clave específica del almacenamiento local de forma segura
export const eliminarCache = (clave: string): void => {
  if (!puedeUsarStorage()) return;

  try {
    window.localStorage.removeItem(clave);
  } catch {}
};

// Guarda datos con metadata de expiración en almacenamiento local
export const guardarCache = <T>(clave: string, datos: T, ttlMs: number): void => {
  if (!puedeUsarStorage()) return;

  try {
    const entrada: EntradaCache<T> = {
      version: VERSION_CACHE,
      guardadoEn: Date.now(),
      ttlMs,
      datos,
    };
    window.localStorage.setItem(clave, JSON.stringify(entrada));
  } catch {}
};

// Lee y valida una entrada cacheada según versión y expiración
export const leerCache = <T>(clave: string): ResultadoLecturaCache<T> => {
  if (!puedeUsarStorage()) return { valido: false, datos: null };

  try {
    const contenido = window.localStorage.getItem(clave);
    if (!contenido) return { valido: false, datos: null };

    const entrada = JSON.parse(contenido) as Partial<EntradaCache<T>>;
    if (
      entrada?.version !== VERSION_CACHE ||
      typeof entrada?.guardadoEn !== "number" ||
      typeof entrada?.ttlMs !== "number"
    ) {
      eliminarCache(clave);
      return { valido: false, datos: null };
    }

    const vencido = Date.now() - entrada.guardadoEn > entrada.ttlMs;
    if (vencido) {
      eliminarCache(clave);
      return { valido: false, datos: null };
    }

    if (!("datos" in entrada)) {
      eliminarCache(clave);
      return { valido: false, datos: null };
    }

    return { valido: true, datos: entrada.datos as T };
  } catch {
    eliminarCache(clave);
    return { valido: false, datos: null };
  }
};

// Elimina todas las entradas que coincidan con un prefijo de clave
export const eliminarCachePorPrefijo = (prefijo: string): void => {
  if (!puedeUsarStorage()) return;

  try {
    const claves = Object.keys(window.localStorage);
    claves.forEach((clave) => {
      if (clave.startsWith(prefijo)) {
        window.localStorage.removeItem(clave);
      }
    });
  } catch {}
};
