// ---------------- IMPORTACIONES ----------------
import { createHash, randomUUID } from "crypto";

// ---------------- CONSTANTES ----------------
const IP_POR_DEFECTO = "unknown";

// ---------------- FUNCIONES ----------------
// Obtiene la primera IP válida del header x-forwarded-for
const obtenerPrimeraIpReenviada = (encabezado: string | null): string | null => {
  if (!encabezado) return null;
  const primeraIp = encabezado.split(",")[0]?.trim();
  return primeraIp || null;
};

// Devuelve la IP cliente priorizando headers de proxy
export const obtenerIpCliente = (solicitud: Request): string => {
  const ipReenviada = obtenerPrimeraIpReenviada(solicitud.headers.get("x-forwarded-for"));
  const ipReal = solicitud.headers.get("x-real-ip")?.trim();
  return ipReenviada || ipReal || IP_POR_DEFECTO;
};

// Convierte la IP en hash corto para logs sin exponer el valor original
export const hashearIp = (ip: string): string => {
  return createHash("sha256").update(ip).digest("hex").slice(0, 24);
};

// Obtiene un id de solicitud desde headers o genera uno nuevo
export const obtenerIdSolicitud = (solicitud: Request): string => {
  return solicitud.headers.get("x-request-id") || randomUUID();
};

// Construye el contexto base usado en seguridad y observabilidad
export const obtenerContextoSolicitud = (solicitud: Request) => {
  const ipCliente = obtenerIpCliente(solicitud);
  return {
    idSolicitud: obtenerIdSolicitud(solicitud),
    ipCliente,
    hashIp: hashearIp(ipCliente),
  };
};
