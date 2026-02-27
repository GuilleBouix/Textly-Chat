// ---------------- IMPORTACIONES ----------------
"use client";
import { ReactNode } from "react";

// ---------------- TIPOS ----------------
interface ModalProps {
  titulo: string;
  descripcion: string;
  abierto: boolean;
  alCerrar: () => void;
  alConfirmar: () => void;
  children?: ReactNode;
  colorBoton?: string;
  textoConfirmar?: string;
}

// ---------------- COMPONENTE ----------------
export default function Modal({
  titulo,
  descripcion,
  abierto,
  alCerrar,
  alConfirmar,
  children,
  colorBoton = "bg-violet-600 hover:bg-violet-500",
  textoConfirmar = "Confirmar",
}: ModalProps) {
  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4
    animate-fade-up animate-duration-500"
    >
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-800 bg-linear-to-br from-zinc-950 to-zinc-900 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-1 text-white">{titulo}</h3>
          <p className="text-sm text-zinc-400 mb-4">{descripcion}</p>
          {children}
        </div>
        <div className="flex p-4 border-t border-zinc-800 gap-3">
          <button
            onClick={alCerrar}
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={alConfirmar}
            className={`flex-1 rounded-xl px-4 py-2 text-sm font-bold text-white transition-colors cursor-pointer ${colorBoton}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}

