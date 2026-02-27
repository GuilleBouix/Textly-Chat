// ---------------- IMPORTACIONES ----------------
import { z } from "zod";

// ---------------- CONSTANTES ----------------
// Valida el payload de mejora o traducción de mensaje
export const esquemaMejora = z.object({
  action: z.enum(["improve", "translate"]),
  text: z.string().trim().min(1).max(1500),
});

// Valida el payload de consulta de metadatos de usuarios
export const esquemaMetaUsuarios = z.object({
  ids: z.array(z.string().uuid()).min(1).max(50),
});

// ---------------- TIPOS ----------------
export type EntradaMejora = z.infer<typeof esquemaMejora>;
export type EntradaMetaUsuarios = z.infer<typeof esquemaMetaUsuarios>;
