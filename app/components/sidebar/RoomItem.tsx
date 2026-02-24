// ----------- IMPORTS -----------
import { useEffect, useRef, useState } from "react";
import {
  LuCheck,
  LuCopy,
  LuTrash2,
  LuUserRound,
  LuUsersRound,
} from "react-icons/lu";
import { Sala } from "../../types/database";

// ----------- TIPOS -----------
interface RoomItemProps {
  sala: Sala;
  isActiva: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

// ----------- COMPONENTE -----------
export default function RoomItem({
  sala,
  isActiva,
  onSelect,
  onDelete,
}: RoomItemProps) {
  const nombreSala = sala.room_name || "Sin nombre";
  const inicialSala = nombreSala.trim().charAt(0).toUpperCase() || "S";
  const salaCompleta = Boolean(sala.participant_2);
  const [copiado, setCopiado] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const copiarCodigo = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ): Promise<void> => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(sala.share_code);
      setCopiado(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopiado(false), 1200);
    } catch (error) {
      console.error("No se pudo copiar el codigo:", error);
    }
  };

  return (
    <div
      onClick={() => onSelect(sala.id)}
      className={`group relative cursor-pointer rounded-2xl border p-3 pr-12 transition-colors animate-fade-right ${
        isActiva
          ? "border-fuchsia-900 bg-linear-to-br from-zinc-950 to-zinc-900"
          : "border-zinc-800 bg-linear-to-br from-zinc-950 to-zinc-900 hover:border-fuchsia-950"
      }`}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900 text-sm font-extrabold text-white">
          {inicialSala}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold uppercase text-zinc-100">
              {nombreSala}
            </p>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${
                salaCompleta
                  ? "border-emerald-600 bg-emerald-950 text-emerald-300"
                  : "border-purple-600 bg-purple-950 text-purple-200"
              }`}
            >
              {salaCompleta ? (
                <LuUsersRound className="h-3 w-3" />
              ) : (
                <LuUserRound className="h-3 w-3" />
              )}
              {salaCompleta ? "2/2" : "1/2"}
            </span>
          </div>

          <div className="group/codigo mt-1 flex items-center gap-1.5">
            <span className="truncate text-[11px] font-mono font-semibold uppercase tracking-wide text-violet-300">
              Codigo #{sala.share_code}
            </span>
            <button
              type="button"
              onClick={copiarCodigo}
              title="Copiar codigo"
              aria-label="Copiar codigo"
              className="text-zinc-400 opacity-0 transition-all duration-150 cursor-pointer group-hover/codigo:opacity-100 hover:text-zinc-100"
            >
              {copiado ? (
                <p className="flex items-center text-[9px] text-zinc-400">
                  <LuCheck className="h-3 w-3 text-emerald-400" /> Copiado
                </p>
              ) : (
                <LuCopy className="h-3 w-3" />
              )}
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(sala.id);
        }}
        title="Eliminar sala"
        aria-label="Eliminar sala"
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-zinc-400 transition-colors cursor-pointer hover:text-red-700 hover:bg-red-700/15"
      >
        <LuTrash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
