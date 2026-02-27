// ---------------- TIPOS ----------------
type EventoSeguridad =
  | "rate_limited"
  | "auth_fail"
  | "meta_unauthorized_ids"
  | "improve_error"
  | "config_error";

type NivelLogSeguridad = "info" | "warn" | "error";

// ---------------- FUNCIONES_EXPORTADAS ----------------
// Registra un evento de seguridad con formato JSON estructurado
export const registrarEventoSeguridad = (
  evento: EventoSeguridad,
  datos: Record<string, unknown>,
  nivel: NivelLogSeguridad = "info",
): void => {
  // Construye el objeto base con marca temporal para trazabilidad
  const carga = {
    ts: new Date().toISOString(),
    event: evento,
    ...datos,
  };

  // Emite en error cuando el evento es crítico
  if (nivel === "error") {
    console.error(JSON.stringify(carga));
    return;
  }

  // Emite en warning para eventos de riesgo no crítico
  if (nivel === "warn") {
    console.warn(JSON.stringify(carga));
    return;
  }

  // Emite en info para telemetría operativa
  console.info(JSON.stringify(carga));
};
