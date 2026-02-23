import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ============================================
// CONFIGURACION
// ============================================

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ============================================
// TIPOS
// ============================================

type ModoRedaccion = "formal" | "informal";
type Idioma = "es" | "en" | "pt";
type AccionIA = "improve" | "translate";

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function generarPrompt(
  text: string,
  modo: ModoRedaccion,
  idioma: Idioma,
  accion: AccionIA,
): string {
  const idiomaTexto: Record<Idioma, string> = {
    es: "en espanol",
    en: "in English",
    pt: "em portugues",
  };

  const tonoDescripcion =
    modo === "formal"
      ? "Usa un tono profesional, cortés y formal."
      : "Usa un tono casual, amigable y natural.";

  if (accion === "translate") {
    return `Traduce el siguiente mensaje de chat ${idiomaTexto[idioma]}.
${tonoDescripcion}
Reglas:
- Mantiene el mismo significado e intencion.
- Ajusta la redaccion al tono solicitado.
- No agregues informacion nueva.
- No expliques nada.
- Devuelve SOLO el texto final traducido, sin comillas ni comentarios.

Mensaje:
${text}`;
  }

  return `Mejora el siguiente mensaje de chat sin traducirlo.
${tonoDescripcion}
Reglas:
- Mantiene el idioma original del mensaje.
- Mantiene el mismo significado e intencion.
- Corrige redaccion, claridad y ortografia.
- No agregues informacion nueva.
- No expliques nada.
- Devuelve SOLO el texto final, sin comillas ni comentarios.

Mensaje:
${text}`;
}

// ============================================
// RUTA POST
// ============================================

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta GEMINI_API_KEY en variables de entorno" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const text = body?.text;
    const modo: ModoRedaccion = body?.modo || "informal";
    const idioma: Idioma = body?.idioma || "es";
    const accion: AccionIA = body?.accion === "translate" ? "translate" : "improve";

    if (!text || typeof text !== "string") {
      return NextResponse.json(
        { error: "No se recibio texto valido" },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = generarPrompt(text, modo, idioma, accion);

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({
      improvedText: output?.trim() || "",
      accion,
    });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; statusText?: string };
    const message = err?.message || "Error interno en la IA";

    console.error("ERROR /api/improve:", {
      modelName,
      message,
      status: err?.status,
      statusText: err?.statusText,
    });

    const isModelNotFound =
      typeof message === "string" &&
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
