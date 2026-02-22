import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// ============================================
// CONFIGURACION
// ============================================

// Clave API de Gemini
const apiKey = process.env.GEMINI_API_KEY;

// Nombre del modelo a usar
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// ============================================
// RUTA POST - Mejorar texto con IA
// ============================================

export async function POST(req: Request) {
  try {
    // Valida que exista la API key
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta GEMINI_API_KEY en variables de entorno" },
        { status: 500 },
      );
    }

    // Obtiene el texto del body
    const body = await req.json();
    const textToImprove = body?.text;

    // Valida que el texto sea valido
    if (!textToImprove || typeof textToImprove !== "string") {
      return NextResponse.json(
        { error: "No se recibio texto valido" },
        { status: 400 },
      );
    }

    // Inicializa el modelo de Gemini
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Prompt con instrucciones para mejorar el mensaje
    const prompt = `Mejora el siguiente mensaje de chat.
      Reglas:
      - Manten el mismo significado e intencion.
      - Corrige redaccion, claridad y ortografia.
      - Conserva un tono casual y natural.
      - No agregues informacion nueva.
      - No expliques nada.
      - Devuelve SOLO el texto final, sin comillas ni comentarios.

      Mensaje:
      ${textToImprove}
    `;

    // Genera el contenido mejorado
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({ improvedText: output?.trim() || "" });
  } catch (error: unknown) {
    const err = error as { message?: string; status?: number; statusText?: string };
    const message = err?.message || "Error interno en la IA";

    console.error("ERROR /api/improve:", {
      modelName,
      message,
      status: err?.status,
      statusText: err?.statusText,
    });

    // Verifica si el modelo no esta disponible
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
