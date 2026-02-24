// ----------- IMPORTS -----------
"use client";
import { LuLogOut, LuSettings } from "react-icons/lu";
import { Sala } from "../../types/database";
import RoomItem from "./RoomItem";

// ----------- TIPOS -----------
interface SidebarProps {
  usuario: {
    id: string;
    email?: string;
    avatarUrl?: string | null;
    nombre?: string;
    username?: string;
  } | null;
  salas: Sala[];
  idSalaActiva: string;
  alSeleccionarSala: (id: string) => void;
  alEliminarSala: (id: string) => void;
  abrirModalUnirse: () => void;
  abrirModalCrear: () => void;
  alCerrarSesion: () => void;
}

// ----------- COMPONENTE -----------
export default function Sidebar({
  usuario,
  salas,
  idSalaActiva,
  alSeleccionarSala,
  alEliminarSala,
  abrirModalUnirse,
  abrirModalCrear,
  alCerrarSesion,
}: SidebarProps) {
  return (
    <aside className="relative z-10 flex h-full w-80 flex-col border-r border-zinc-800/95 bg-zinc-950/80 backdrop-blur-[1px]">
      <div className="flex items-center gap-3 border-b border-zinc-800 py-4 px-6">
        <img
          src={usuario?.avatarUrl || "/default-avatar.png"}
          onError={(e) => {
            e.currentTarget.src = "/default-avatar.png";
          }}
          alt="Avatar del usuario"
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />

        <div className="min-w-0 flex-1 overflow-hidden">
          <p className="truncate text-sm font-bold text-zinc-100">
            {usuario?.nombre || usuario?.username || "Invitado"}
          </p>

          <p className="flex items-center gap-1.5 text-[10px] text-green-400">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            Online
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Ajustes"
            aria-label="Ajustes"
            className="rounded-full p-2 text-zinc-300 transition hover:bg-zinc-800 hover:text-white"
          >
            <LuSettings className="h-4 w-4" />
          </button>

          <button
            type="button"
            onClick={alCerrarSesion}
            title="Cerrar sesion"
            aria-label="Cerrar sesion"
            className="rounded-full p-2 text-zinc-300 transition hover:bg-red-600/80 hover:text-white"
          >
            <LuLogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <button
          onClick={abrirModalCrear}
          className="w-full rounded-full bg-linear-to-r from-violet-600 via-purple-600 to-fuchsia-600 py-2.5 text-sm font-bold text-white transition-all cursor-pointer 
          hover:from-violet-500 hover:via-purple-500 hover:bg-fuchsia-500"
        >
          + Nueva Sala
        </button>
        <button
          onClick={abrirModalUnirse}
          className="w-full rounded-full border border-purple-500/80 bg-transparent py-2.5 text-sm text-purple-200 transition-all cursor-pointer
          hover:border-fuchsia-400 hover:text-fuchsia-200 hover:bg-fuchsia-500/10"
        >
          Unirse con Código
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="mb-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
          Tus Chats
        </p>
        <div className="space-y-2.5">
          {salas.map((sala) => (
            <RoomItem
              key={sala.id}
              sala={sala}
              isActiva={idSalaActiva === sala.id}
              onSelect={alSeleccionarSala}
              onDelete={alEliminarSala}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}
