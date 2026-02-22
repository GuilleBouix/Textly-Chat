"use client";

import { useEffect, useRef, useState } from "react";
import { LuLanguages, LuSparkles } from "react-icons/lu";

interface AiAssistantMenuProps {
  onImprove: () => void | Promise<void>;
  onTranslate: () => void | Promise<void>;
  disabled?: boolean;
}

export default function AiAssistantMenu({
  onImprove,
  onTranslate,
  disabled = false,
}: AiAssistantMenuProps) {
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!contenedorRef.current) return;
      if (!contenedorRef.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={contenedorRef} className="relative">
      {abierto && (
        <div className="absolute bottom-full right-0 z-20 mb-2 w-52 rounded-xl border border-zinc-700 bg-zinc-900 p-1 shadow-xl shadow-black/30">
          <button
            type="button"
            onClick={async () => {
              await onImprove();
              setAbierto(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800
            cursor-pointer"
          >
            <LuSparkles className="text-violet-400" />
            Mejorar Redaccion
          </button>
          <button
            type="button"
            onClick={async () => {
              await onTranslate();
              setAbierto(false);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-zinc-200 hover:bg-zinc-800
            cursor-pointer"
          >
            <LuLanguages className="text-purple-400" />
            Traducir Mensaje
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setAbierto((prev) => !prev)}
        disabled={disabled}
        aria-expanded={abierto}
        className={`group relative flex items-center overflow-hidden rounded-full p-2 transition-all duration-300 ${
          abierto
            ? "bg-zinc-800 text-violet-400"
            : "text-zinc-400 hover:bg-zinc-800 hover:text-violet-400"
        } ${disabled ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
      >
        <div
          className={`flex items-center overflow-hidden transition-all duration-300 ${
            abierto
              ? "mr-2 max-w-xs opacity-100"
              : "max-w-0 opacity-0 group-hover:mr-2 group-hover:max-w-xs group-hover:opacity-100"
          }`}
        >
          <span className="whitespace-nowrap pl-2 text-xs font-medium">
            Asistente de IA
          </span>
        </div>
        <LuSparkles className="shrink-0" />
      </button>
    </div>
  );
}
