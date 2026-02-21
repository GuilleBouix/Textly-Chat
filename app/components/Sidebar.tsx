"use client";
import { UsuarioSupabase, Sala } from "../types/database";

interface SidebarProps {
  usuario: UsuarioSupabase | null;
  salas: Sala[];
  idSalaActiva: string;
  alSeleccionarSala: (id: string) => void;
  alEliminarSala: (id: string) => void;
  abrirModalUnirse: () => void;
  alCrearSala: () => void;
}

export default function Sidebar({
  usuario,
  salas,
  idSalaActiva,
  alSeleccionarSala,
  alEliminarSala,
  abrirModalUnirse,
  alCrearSala,
}: SidebarProps) {
  return (
    <aside className="w-80 bg-zinc-900 border-r border-zinc-800 flex flex-col h-full">
      {/* PERFIL */}
      <div className="p-6 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-blue-500 to-purple-600 flex items-center justify-center font-bold text-white">
          {usuario?.email?.charAt(0).toUpperCase() || "?"}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold truncate text-zinc-100">
            {usuario?.email?.split("@")[0] || "Invitado"}
          </p>
          <p className="text-[10px] text-zinc-500 truncate">{usuario?.email}</p>
        </div>
      </div>

      {/* ACCIONES */}
      <div className="p-4 space-y-2">
        <button
          onClick={alCrearSala}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-xl transition-all shadow-lg shadow-blue-900/20 text-sm"
        >
          + Nueva Sala
        </button>
        <button
          onClick={abrirModalUnirse}
          className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 rounded-xl border border-zinc-700 transition-all text-sm"
        >
          Unirse con código
        </button>
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 px-2 font-semibold">
          Tus Chats
        </p>
        <div className="space-y-2">
          {salas.map((sala) => (
            <div
              key={sala.id}
              onClick={() => alSeleccionarSala(sala.id)}
              className={`group p-3 rounded-xl border transition-all relative cursor-pointer ${
                idSalaActiva === sala.id
                  ? "bg-blue-600/10 border-blue-500/50"
                  : "bg-zinc-950 border-zinc-900 hover:border-zinc-700"
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-mono text-blue-400 font-bold">
                  #{sala.share_code}
                </span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                    sala.participant_id
                      ? "bg-green-900/30 text-green-400"
                      : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {sala.participant_id ? "2/2" : "1/2"}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alEliminarSala(sala.id);
                }}
                className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-900/30 rounded-lg text-red-500 transition-all text-xs"
              >
                🗑️
              </button>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
