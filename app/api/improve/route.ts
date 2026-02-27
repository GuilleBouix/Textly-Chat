import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logSecurityEvent } from "../../lib/security/logger";
import { checkRateLimit } from "../../lib/security/rate-limit";
import { getRequestContext } from "../../lib/security/request";
import { improveSchema } from "../../lib/security/schemas";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WritingMode = "formal" | "informal";
type TranslationLanguage = "es" | "en" | "pt" | "it" | "de";

type UserSettingsRow = {
  assistant_enabled: boolean;
  writing_mode: WritingMode;
  translation_language: TranslationLanguage;
};

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

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

const buildImprovePrompt = (text: string, writingMode: WritingMode): string => {
  const tono = writingMode === "formal" ? "formal y profesional" : "informal y natural";

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
${text}`;
};

const buildTranslatePrompt = (
  text: string,
  writingMode: WritingMode,
  language: TranslationLanguage,
): string => {
  const tono = writingMode === "formal" ? "formal y profesional" : "informal y natural";
  const idiomaDestino = LANGUAGE_LABEL[language];

  return `Traduce el siguiente mensaje.
Reglas:
- Traducir al idioma destino: ${idiomaDestino}.
- Mantener el significado e intencion original.
- Aplicar un tono ${tono}.
- No agregar informacion nueva.
- No explicar nada.
- Devolver SOLO el texto final, sin comillas ni comentarios.

Mensaje:
${text}`;
};

export async function POST(req: Request) {
  const { requestId, ipHash } = getRequestContext(req);

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!apiKey || !url || !anonKey) {
      logSecurityEvent(
        "config_error",
        { requestId, route: "/api/improve", hasApiKey: Boolean(apiKey), hasUrl: Boolean(url), hasAnonKey: Boolean(anonKey) },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    const body = await req.json().catch(() => null);
    const parsed = improveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Payload invalido" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = createServerClient(url, anonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll() {},
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      logSecurityEvent("auth_fail", { requestId, route: "/api/improve", ipHash }, "warn");
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const rl = await checkRateLimit({
      namespace: "improve",
      userId: user.id,
      ipHash,
    });

    if (!rl.ok && "misconfigured" in rl) {
      logSecurityEvent(
        "config_error",
        { requestId, route: "/api/improve", reason: "missing_upstash_env" },
        "error",
      );
      return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }

    if (!rl.ok && "retryAfter" in rl) {
      logSecurityEvent(
        "rate_limited",
        {
          requestId,
          route: "/api/improve",
          userId: user.id,
          ipHash,
          retryAfter: rl.retryAfter,
        },
        "warn",
      );

      return NextResponse.json(
        { error: "Demasiadas solicitudes, intenta mas tarde" },
        {
          status: 429,
          headers: {
            "Retry-After": String(rl.retryAfter),
          },
        },
      );
    }

    const { action, text } = parsed.data;

    const { data: settingsDataRaw, error: settingsError } = await supabase
      .from("user_settings")
      .select("assistant_enabled, writing_mode, translation_language")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      logSecurityEvent(
        "improve_error",
        {
          requestId,
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

    const prompt =
      action === "improve"
        ? buildImprovePrompt(text, settings.writing_mode)
        : buildTranslatePrompt(text, settings.writing_mode, settings.translation_language);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({ outputText: output?.trim() || "" }, { status: 200 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "unknown_error";

    logSecurityEvent(
      "improve_error",
      {
        requestId,
        route: "/api/improve",
        message,
        model: modelName,
      },
      "error",
    );

    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
