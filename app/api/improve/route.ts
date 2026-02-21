import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export async function POST(req: Request) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: "Falta GEMINI_API_KEY en variables de entorno" },
        { status: 500 },
      );
    }

    const body = await req.json();
    const textToImprove = body?.text;

    if (!textToImprove || typeof textToImprove !== "string") {
      return NextResponse.json(
        { error: "No se recibio texto valido" },
        { status: 400 },
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const output = response.text();

    return NextResponse.json({ improvedText: output?.trim() || "" });
  } catch (error: any) {
    const message = error?.message || "Error interno en la IA";

    console.error("ERROR /api/improve:", {
      modelName,
      message,
      status: error?.status,
      statusText: error?.statusText,
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
