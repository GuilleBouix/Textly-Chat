type SecurityEvent =
  | "rate_limited"
  | "auth_fail"
  | "meta_unauthorized_ids"
  | "improve_error"
  | "config_error";

type SecurityLogLevel = "info" | "warn" | "error";

export const logSecurityEvent = (
  event: SecurityEvent,
  data: Record<string, unknown>,
  level: SecurityLogLevel = "info",
): void => {
  const payload = {
    ts: new Date().toISOString(),
    event,
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
};
