"use client";
import { useState } from "react";
import { LuSparkles, LuX } from "react-icons/lu";
import {
  TranslationLanguage,
  UserSettings,
  WritingMode,
} from "../../types/database";

type UpdateUserSettingsInput = {
  assistant_enabled?: boolean;
  writing_mode?: WritingMode;
  translation_language?: TranslationLanguage;
};

interface SettingsModalProps {
  abierto: boolean;
  alCerrar: () => void;
  guardando: boolean;
  configIA: UserSettings | null;
  alActualizarConfigIA: (config: UpdateUserSettingsInput) => Promise<void>;
}

export default function SettingsModal({
  abierto,
  alCerrar,
  guardando,
  configIA,
  alActualizarConfigIA,
}: SettingsModalProps) {
  const [asistenteActivo, setAsistenteActivo] = useState(
    configIA?.assistant_enabled ?? true,
  );
  const [modoRedaccion, setModoRedaccion] = useState<WritingMode>(
    configIA?.writing_mode ?? "informal",
  );
  const [idioma, setIdioma] = useState<TranslationLanguage>(
    configIA?.translation_language ?? "es",
  );

  if (!abierto) return null;

  const handleGuardarIA = async (): Promise<void> => {
    try {
      await alActualizarConfigIA({
        assistant_enabled: asistenteActivo,
        writing_mode: modoRedaccion,
        translation_language: idioma,
      });
      alCerrar();
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
      <div className="flex h-auto w-full max-w-md flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl animate-fade-up">
        <div className="flex items-center justify-between border-b border-zinc-800 p-4">
          <h2 className="text-lg font-bold text-white">Asistente de IA</h2>
          <button
            onClick={alCerrar}
            className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <LuX size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-hidden p-4">
          <div className="space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    asistenteActivo ? "bg-violet-500" : "bg-zinc-800"
                  }`}
                >
                  <LuSparkles
                    size={20}
                    className={`transition-all duration-200 ${
                      asistenteActivo
                        ? "text-white opacity-100"
                        : "text-zinc-500 opacity-75"
                    }`}
                  />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    Asistente de IA
                  </p>
                  <p className="text-xs text-zinc-500">
                    Mejora tus mensajes automaticamente.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAsistenteActivo(!asistenteActivo)}
                className={`relative h-6 w-11 rounded-full cursor-pointer transition-colors ${
                  asistenteActivo ? "bg-violet-500" : "bg-zinc-700"
                }`}
              >
                <span
                  className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all duration-200 ease-out ${
                    asistenteActivo ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="mb-2 block text-xs font-medium text-zinc-400">
                Modo de Redaccion
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setModoRedaccion("formal")}
                  className={`cursor-pointer rounded-xl border p-3 text-sm font-medium transition-colors ${
                    modoRedaccion === "formal"
                      ? "border-violet-400 bg-violet-500/20 text-violet-300"
                      : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Formal
                </button>
                <button
                  onClick={() => setModoRedaccion("informal")}
                  className={`cursor-pointer rounded-xl border p-3 text-sm font-medium transition-colors ${
                    modoRedaccion === "informal"
                      ? "border-violet-400 bg-violet-500/20 text-violet-300"
                      : "border-zinc-700 bg-zinc-950 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  Informal
                </button>
              </div>
            </div>

            <div>
              <label className="mb-2.5 block text-sm font-medium text-zinc-200">
                Idioma de Traduccion
              </label>
              <select
                value={idioma}
                onChange={(e) =>
                  setIdioma(e.target.value as TranslationLanguage)
                }
                className="block w-full cursor-pointer rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 shadow-xs outline-none transition-colors focus:border-violet-500"
              >
                <option value="es">Espanol</option>
                <option value="en">Ingles</option>
                <option value="pt">Portugues</option>
                <option value="it">Italiano</option>
                <option value="de">Aleman</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex gap-3 border-t border-zinc-800 p-4">
          <button
            onClick={alCerrar}
            className="flex-1 cursor-pointer rounded-xl bg-zinc-800 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleGuardarIA}
            disabled={guardando}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
