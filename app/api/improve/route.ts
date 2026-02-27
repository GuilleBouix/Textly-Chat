import { GoogleGenerativeAI } from "@google/generative-ai";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type WritingMode = "formal" | "informal";
type TranslationLanguage = "es" | "en" | "pt" | "it" | "de";
type ImproveAction = "improve" | "translate";

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
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta GEMINI_API_KEY en variables de entorno" },
        { status: 500 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      return NextResponse.json(
        { error: "Faltan variables de Supabase en servidor" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const action = body?.action as ImproveAction;
    const text = body?.text;

    if (action !== "improve" && action !== "translate") {
      return NextResponse.json(
        { error: "Accion invalida. Usa improve o translate." },
        { status: 400 },
      );
    }

    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json({ error: "No se recibio texto valido" }, { status: 400 });
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
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: settingsDataRaw, error: settingsError } = await supabase
      .from("user_settings")
      .select("assistant_enabled, writing_mode, translation_language")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("ERROR settings /api/improve:", settingsError.message);
    }

    const settings = (settingsDataRaw as UserSettingsRow | null) || DEFAULT_SETTINGS;

    if (!settings.assistant_enabled) {
      return NextResponse.json(
        { error: "Asistente de IA desactivado en ajustes." },
        { status: 403 },
      );
    }

    const prompt =
      action === "improve"
        ? buildImprovePrompt(text, settings.writing_mode)
        : buildTranslatePrompt(
            text,
            settings.writing_mode,
            settings.translation_language,
          );

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({ outputText: output?.trim() || "" });
  } catch (error: unknown) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message)
        : "Error interno en la IA";

    console.error("ERROR /api/improve:", {
      modelName,
      message,
      status:
        error && typeof error === "object" && "status" in error
          ? (error as { status?: unknown }).status
          : undefined,
      statusText:
        error && typeof error === "object" && "statusText" in error
          ? (error as { statusText?: unknown }).statusText
          : undefined,
    });

    const isModelNotFound =
      message.includes("is not found for API version") &&
      message.includes("generateContent");

    return NextResponse.json(
      {
        error: isModelNotFound
          ? "Modelo Gemini no disponible para generateContent"
          : "Error interno en la IA",
        details: message,
        model: modelName,
      },
      { status: isModelNotFound ? 400 : 500 },
    );
  }
}
