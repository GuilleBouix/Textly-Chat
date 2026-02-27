// ---------------- IMPORTACIONES ----------------
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ---------------- TIPOS ----------------
type EspacioLimite = "improve" | "users_meta";

type ResultadoLimiteSolicitudes =
  | {
      permitido: true;
    }
  | {
      permitido: false;
      reintentarEn: number;
    }
  | {
      permitido: false;
      malConfigurado: true;
    };

// ---------------- CONSTANTES ----------------
const MAXIMO_MEJORAR = Number(process.env.RATE_LIMIT_IMPROVE_MAX ?? 20);
const MAXIMO_META_USUARIOS = Number(process.env.RATE_LIMIT_META_MAX ?? 60);
const VENTANA = "5 m";

const urlRedis = process.env.UPSTASH_REDIS_REST_URL;
const tokenRedis = process.env.UPSTASH_REDIS_REST_TOKEN;

const redisConfigurado = Boolean(urlRedis && tokenRedis);

let limiteMejorar: Ratelimit | null = null;
let limiteMetaUsuarios: Ratelimit | null = null;

// ---------------- FUNCIONES ----------------
// Crea una instancia de rate limiter para una cuota específica
const crearLimitador = (limite: number): Ratelimit | null => {
  if (!redisConfigurado) return null;

  const redis = new Redis({
    url: urlRedis!,
    token: tokenRedis!,
  });

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limite, VENTANA),
    analytics: true,
    prefix: "textly-chat",
  });
};

// Devuelve el limitador correspondiente al namespace del endpoint
const obtenerLimitadorPorEspacio = (espacio: EspacioLimite): Ratelimit | null => {
  if (espacio === "improve") {
    if (!limiteMejorar) limiteMejorar = crearLimitador(MAXIMO_MEJORAR);
    return limiteMejorar;
  }

  if (!limiteMetaUsuarios) limiteMetaUsuarios = crearLimitador(MAXIMO_META_USUARIOS);
  return limiteMetaUsuarios;
};

// Verifica si una solicitud puede continuar según usuario e IP hasheada
export const verificarLimiteSolicitudes = async ({
  espacio,
  idUsuario,
  hashIp,
}: {
  espacio: EspacioLimite;
  idUsuario: string;
  hashIp: string;
}): Promise<ResultadoLimiteSolicitudes> => {
  const limitador = obtenerLimitadorPorEspacio(espacio);

  if (!limitador) {
    if (process.env.NODE_ENV === "production") {
      return { permitido: false, malConfigurado: true };
    }

    return { permitido: true };
  }

  const llave = `rl:${espacio}:${idUsuario}:${hashIp}`;
  const resultado = await limitador.limit(llave);

  if (resultado.success) {
    return { permitido: true };
  }

  const milisegundosReintento = Math.max(resultado.reset - Date.now(), 0);
  return {
    permitido: false,
    reintentarEn: Math.ceil(milisegundosReintento / 1000),
  };
};
