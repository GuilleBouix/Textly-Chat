// ----------- IMPORTS -----------
"use client";
import { ReactNode } from "react";

// ----------- TIPOS -----------
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

// ----------- COMPONENTE -----------
export default function Modal({
  titulo,
  descripcion,
  abierto,
  alCerrar,
  alConfirmar,
  children,
  colorBoton = "bg-blue-600",
  textoConfirmar = "Confirmar",
}: ModalProps) {
  if (!abierto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <h3 className="text-lg font-bold mb-1 text-white">{titulo}</h3>
          <p className="text-sm text-zinc-400 mb-4">{descripcion}</p>
          {children}
        </div>
        <div className="flex p-4 bg-zinc-950 gap-3">
          <button
            onClick={alCerrar}
            className="flex-1 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={alConfirmar}
            className={`flex-1 px-4 py-2 rounded-xl text-white font-bold text-sm transition-colors ${colorBoton}`}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
