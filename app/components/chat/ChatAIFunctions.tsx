import { useEffect, useRef, useState } from "react";
import { LuLanguages, LuSparkles } from "react-icons/lu";

interface ChatAIFunctionsProps {
  cargandoIA: boolean;
  asistenteIAActivo: boolean;
  onMejorar: () => void;
  onTraducir: () => void;
}

export default function ChatAIFunctions({
  cargandoIA,
  asistenteIAActivo,
  onMejorar,
  onTraducir,
}: ChatAIFunctionsProps) {
  const [mostrarOpcionesIA, setMostrarOpcionesIA] = useState(false);
  const menuIAAbierto = mostrarOpcionesIA && asistenteIAActivo;
  const asistenteIARef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuIAAbierto) return;

    const handleClickOutside = (event: MouseEvent): void => {
      if (!asistenteIARef.current) return;
      const path =
        typeof event.composedPath === "function" ? event.composedPath() : [];
      const clickDentroDelMenu =
        path.includes(asistenteIARef.current) ||
        asistenteIARef.current.contains(event.target as Node);

      if (!clickDentroDelMenu) {
        setMostrarOpcionesIA(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [menuIAAbierto]);

  return (
    <div ref={asistenteIARef} className="relative">
      {menuIAAbierto ? (
        <div className="absolute bottom-15 right-0 z-999 w-64 rounded-2xl rounded-br-md border border-purple-500 bg-zinc-900 p-2">
          <button
            type="button"
            onClick={() => {
              onMejorar();
              setMostrarOpcionesIA(false);
            }}
            disabled={cargandoIA}
            className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LuSparkles className="h-4 w-4 text-violet-300" />
            Mejorar redacción
          </button>

          <button
            type="button"
            onClick={() => {
              onTraducir();
              setMostrarOpcionesIA(false);
            }}
            disabled={cargandoIA}
            className="mt-1 flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-100 transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LuLanguages className="h-4 w-4 text-fuchsia-300" />
            Traducir mensaje
          </button>
        </div>
      ) : null}

      <button
        type="button"
        onClick={() => setMostrarOpcionesIA((prev) => !prev)}
        disabled={cargandoIA || !asistenteIAActivo}
        className={`group flex h-10 w-10 items-center justify-start overflow-hidden rounded-full border border-zinc-700 bg-zinc-900 text-purple-200 transition-all duration-300 ease-out disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer ${
          menuIAAbierto
            ? "md:w-36 md:border-purple-500 md:bg-zinc-800"
            : "md:hover:w-36 md:hover:border-purple-500 md:hover:bg-zinc-800"
        } ${cargandoIA ? "animate-pulse" : ""}`}
        title="Asistente de IA"
        aria-label="Asistente de IA"
      >
        <div className="flex min-w-10 items-center justify-center">
          <LuSparkles className="h-4 w-4 shrink-0" />
        </div>
        <span
          className={`hidden whitespace-nowrap text-xs font-semibold text-purple-100 transition-opacity duration-200 md:block ${
            menuIAAbierto
              ? "md:opacity-100"
              : "md:opacity-0 md:group-hover:opacity-100"
          }`}
        >
          Asistente de IA
        </span>
      </button>
    </div>
  );
}
