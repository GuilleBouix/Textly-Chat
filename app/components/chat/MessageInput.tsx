// ----------- IMPORTS -----------
import { useEffect, useRef, useState } from "react";
import { LuLanguages, LuSend, LuSparkles } from "react-icons/lu";

// ----------- TIPOS -----------
interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onMejorar: () => void;
  cargandoIA: boolean;
}

// ----------- COMPONENTE -----------
export default function MessageInput({
  value,
  onChange,
  onSubmit,
  onMejorar,
  cargandoIA,
}: MessageInputProps) {
  const [mostrarOpcionesIA, setMostrarOpcionesIA] = useState(false);
  const asistenteIARef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mostrarOpcionesIA) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (!asistenteIARef.current) return;
      if (!asistenteIARef.current.contains(event.target as Node)) {
        setMostrarOpcionesIA(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mostrarOpcionesIA]);

  return (
    <footer className="relative border-t border-zinc-800/80 bg-linear-to-t from-zinc-950 via-zinc-950/90 to-transparent p-4">
      {cargandoIA ? (
        <div className="mb-3 flex justify-center">
          <div className="inline-flex items-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-1.5 shadow-[0_0_16px_rgba(139,92,246,0.2)]">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300/40 border-t-violet-200" />
            <p className="text-[11px] font-medium text-violet-100">
              Mejorando redaccion
              <span className="inline-flex w-6 justify-start">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse [animation-delay:120ms]">.</span>
                <span className="animate-pulse [animation-delay:240ms]">.</span>
              </span>
            </p>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={onSubmit}
        className="flex items-center gap-2 rounded-2xl border border-purple-500/35 bg-zinc-900/80 p-2 shadow-[0_8px_28px_rgba(76,29,149,0.2)] transition-all focus-within:border-fuchsia-400/60"
      >
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={cargandoIA}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-xl bg-transparent p-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        />

        <div ref={asistenteIARef} className="relative">
          {mostrarOpcionesIA ? (
            <div className="absolute bottom-12 right-0 z-20 w-64 rounded-2xl border border-purple-500/40 bg-zinc-900/95 p-2 shadow-2xl backdrop-blur">
              <button
                type="button"
                onClick={() => {
                  onMejorar();
                  setMostrarOpcionesIA(false);
                }}
                disabled={cargandoIA}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-100 transition-all hover:bg-purple-500/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LuSparkles className="h-4 w-4 text-violet-300" />
                Mejorar redaccion
              </button>

              <button
                type="button"
                onClick={() => setMostrarOpcionesIA(false)}
                className="mt-1 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-100 transition-all hover:bg-purple-500/15"
              >
                <LuLanguages className="h-4 w-4 text-fuchsia-300" />
                Traducir mensaje
              </button>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setMostrarOpcionesIA((prev) => !prev)}
            disabled={cargandoIA}
            className={`group flex h-10 w-10 items-center justify-start overflow-hidden rounded-full bg-zinc-800 text-purple-200 transition-all duration-300 ease-out hover:w-36 hover:border-fuchsia-400 hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${
              cargandoIA ? "animate-pulse" : ""
            }`}
            title="Asistente de IA"
            aria-label="Asistente de IA"
          >
            <div className="flex min-w-10 items-center justify-center">
              <LuSparkles className="h-4 w-4 shrink-0" />
            </div>
            <span className="whitespace-nowrap text-xs font-semibold text-purple-100 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              Asistente de IA
            </span>
          </button>
        </div>

        <button
          type="submit"
          disabled={cargandoIA}
          aria-label="Enviar mensaje"
          className="flex cursor-pointer items-center gap-2 rounded-full bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-4 py-2.5 text-sm font-bold text-white transition-all hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Enviar
          <LuSend className="h-3.5 w-3.5" />
        </button>
      </form>
    </footer>
  );
}
