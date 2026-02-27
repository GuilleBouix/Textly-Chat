// ---------------- IMPORTACIONES ----------------
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { registrarEventoSeguridad } from "../../lib/security/logger";
import { verificarLimiteSolicitudes } from "../../lib/security/rate-limit";
import { obtenerContextoSolicitud } from "../../lib/security/request";
import { esquemaMejora } from "../../lib/security/schemas";

// ---------------- CONSTANTES ----------------
export const dynamic = "force-dynamic";
export const revalidate = 0;

// ---------------- TIPOS ----------------
type WritingMode = "formal" | "informal";
type TranslationLanguage = "es" | "en" | "pt" | "it" | "de";

type UserSettingsRow = {
  assistant_enabled: boolean;
  writing_mode: WritingMode;
  translation_language: TranslationLanguage;
};

const claveApi = process.env.GEMINI_API_KEY;
const nombreModelo = process.env.GEMINI_MODEL || "gemini-2.5-flash";

const DEFAULT_SETTINGS: UserSettingsRow = {
  assistant_enabled: true,
  writing_mode: "informal",
  translation_language: "es",
};

const LANGUAGE_LABEL: Record<TranslationLanguage, string> = {
  es: "espanol",
  en: "ingles",
  pt: "portugues",
  it: "italiano",
  de: "aleman",
};

// ---------------- FUNCIONES_AUXILIARES ----------------
// Construye el prompt para la acción de mejora de redacción
const construirPromptMejora = (texto: string, modoRedaccion: WritingMode): string => {
  const tono = modoRedaccion === "formal" ? "formal y profesional" : "informal y natural";

  return `Mejora el siguiente mensaje de chat.
Reglas:
- Mantener el idioma original.
- No traducir a otro idioma.
- Mejorar claridad, redaccion y ortografia.
- Mantener el mismo significado e intencion.
- Aplicar un tono ${tono}.
- No agregar informacion nueva.
- No explicar nada.
- Devolver SOLO el texto final, sin comillas ni comentarios.

Mensaje:
${texto}`;
};

// Construye el prompt para la acción de traducción
const construirPromptTraduccion = (
  texto: string,
  modoRedaccion: WritingMode,
  idioma: TranslationLanguage,
): string => {
  const tono = modoRedaccion === "formal" ? "formal y profesional" : "informal y natural";
  const idiomaDestino = LANGUAGE_LABEL[idioma];

  return `Traduce el siguiente mensaje.
Reglas:
- Traducir al idioma destino: ${idiomaDestino}.
- Mantener el significado e intencion original.
- Aplicar un tono ${tono}.
- No agregar informacion nueva.
- No explicar nada.
- Devolver SOLO el texto final, sin comillas ni comentarios.

Mensaje:
${texto}`;
};

// ---------------- HANDLER ----------------
export async function POST(req: Request) {
  // Obtiene el contexto de solicitud para logs y rate limiting
  const { idSolicitud, hashIp } = obtenerContextoSolicitud(req);

  try {
    // Carga configuración mínima necesaria para atender la ruta
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const claveAnonima = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Corta temprano cuando falta configuración crítica
    if (!claveApi || !url || !claveAnonima) {
      registrarEventoSeguridad(
        "config_error",
        { requestId: idSolicitud, route: "/api/improve", hasApiKey: Boolean(claveApi), hasUrl: Boolean(url), hasAnonKey: Boolean(claveAnonima) },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    // Valida el payload de entrada con Zod
    const cuerpo = await req.json().catch(() => null);
    const entradaValidada = esquemaMejora.safeParse(cuerpo);

    if (!entradaValidada.success) {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    // Crea cliente de Supabase ligado a cookies de sesión
    const almacenamientoCookies = await cookies();
    const supabase = createServerClient(url, claveAnonima, {
      cookies: {
        getAll() {
          return almacenamientoCookies.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      registrarEventoSeguridad("auth_fail", { requestId: idSolicitud, route: "/api/improve", ipHash: hashIp }, "warn");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    // Aplica límite de solicitudes por usuario e IP hasheada
    const limite = await verificarLimiteSolicitudes({
      espacio: "improve",
      idUsuario: user.id,
      hashIp,
    });

    if (!limite.permitido && "malConfigurado" in limite) {
      registrarEventoSeguridad(
        "config_error",
        { requestId: idSolicitud, route: "/api/improve", reason: "missing_upstash_env" },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    if (!limite.permitido && "reintentarEn" in limite) {
      registrarEventoSeguridad(
        "rate_limited",
        {
          requestId: idSolicitud,
          route: "/api/improve",
          userId: user.id,
          ipHash: hashIp,
          retryAfter: limite.reintentarEn,
        },
        "warn",
      );

      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta mas tarde" },
        {
          status: 429,
          headers: {
            "Retry-After": String(limite.reintentarEn),
          },
        },
      );
    }

    // Extrae valores ya validados para evitar lógica duplicada de parseo
    const { action, text } = entradaValidada.data;

    const { data: settingsDataRaw, error: settingsError } = await supabase
      .from("user_settings")
      .select("assistant_enabled, writing_mode, translation_language")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      registrarEventoSeguridad(
        "improve_error",
        {
          requestId: idSolicitud,
          route: "/api/improve",
          userId: user.id,
          stage: "load_settings",
          message: settingsError.message,
        },
        "error",
      );
    }

    const settings = (settingsDataRaw as UserSettingsRow | null) || DEFAULT_SETTINGS;

    if (!settings.assistant_enabled) {
      return NextResponse.json({ error: "Operacion no permitida" }, { status: 403 });
    }

    // Construye el prompt según el tipo de acción solicitada
    const prompt =
      action === "improve"
        ? construirPromptMejora(text, settings.writing_mode)
        : construirPromptTraduccion(text, settings.writing_mode, settings.translation_language);

    // Ejecuta la llamada al modelo configurado y devuelve texto final
    const clienteIa = new GoogleGenerativeAI(claveApi);
    const modeloIa = clienteIa.getGenerativeModel({ model: nombreModelo });
    const result = await modeloIa.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({ outputText: output?.trim() || "" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown_error";

    // Registra errores internos sin exponer detalles sensibles al cliente
    registrarEventoSeguridad(
      "improve_error",
      {
        requestId: idSolicitud,
        route: "/api/improve",
        message,
        model: nombreModelo,
      },
      "error",
    );

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
