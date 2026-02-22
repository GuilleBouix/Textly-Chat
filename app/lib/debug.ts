// ============================================
// CONSTANTES
// ============================================

// Scope para identificar logs del chat
const SCOPE = "[chat-debug]";

// ============================================
// FUNCIONES DE DEBUG
// ============================================

// Loguea mensajes informativos
export const debug = (...args: unknown[]) => {
  console.log(SCOPE, ...args);
};

// Loguea errores de forma estructurada
export const debugError = (scope: string, error: unknown) => {
  // Verifica si el error es un objeto
  if (error && typeof error === "object") {
    const maybeError = error as {
      code?: string;
      message?: string;
      details?: string;
      hint?: string;
      status?: number;
    };
    console.error(SCOPE, scope, {
      code: maybeError.code,
      message: maybeError.message,
      details: maybeError.details,
      hint: maybeError.hint,
      status: maybeError.status,
      raw: error,
    });
    return;
  }
  console.error(SCOPE, scope, error);
};
