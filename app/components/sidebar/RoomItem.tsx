// ----------- IMPORTS -----------
import { LuTrash2, LuUserRound, LuUsersRound } from "react-icons/lu";
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

  return (
    <div
      onClick={() => onSelect(sala.id)}
      className={`group relative cursor-pointer rounded-2xl border p-3 pr-12 transition-all ${
        isActiva
          ? "border-fuchsia-500/60 bg-linear-to-r from-violet-900/30 via-purple-900/25 to-fuchsia-900/30 shadow-lg shadow-fuchsia-950/20"
          : "border-zinc-800 bg-zinc-950/70 hover:border-purple-500/50 hover:bg-zinc-900/70"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-sm font-extrabold ${
            isActiva
              ? "border-fuchsia-400/70 bg-linear-to-br from-violet-500/35 via-purple-500/30 to-fuchsia-500/35 text-fuchsia-100"
              : "border-purple-500/40 bg-zinc-900 text-purple-200"
          }`}
        >
          {inicialSala}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-bold text-zinc-100 uppercase">
              {nombreSala}
            </p>
            <span
              className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                salaCompleta
                  ? "border border-emerald-500/30 bg-emerald-500/15 text-emerald-300"
                  : "border border-purple-500/35 bg-purple-500/15 text-purple-200"
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

          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-mono font-semibold uppercase tracking-wide text-violet-300/90">
              Codigo {sala.share_code}
            </span>
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
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-zinc-700/80 p-1.5 text-zinc-400 transition-all hover:border-red-500/70 hover:bg-red-600/80 hover:text-white"
      >
        <LuTrash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
