// ----------- IMPORTS -----------
"use client";
import { useState } from "react";
import { LuLogOut, LuSettings } from "react-icons/lu";
import {
  Sala,
  TranslationLanguage,
  UserSettings,
  WritingMode,
} from "../../types/database";
import SettingsModal from "../ui/SettingsModal";
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
  configIA: UserSettings | null;
  guardandoConfigIA: boolean;
  alActualizarConfigIA: (config: {
    assistant_enabled?: boolean;
    writing_mode?: WritingMode;
    translation_language?: TranslationLanguage;
  }) => Promise<void>;
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
  configIA,
  guardandoConfigIA,
  alActualizarConfigIA,
}: SidebarProps) {
  const [mostrarAjustes, setMostrarAjustes] = useState(false);

  return (
    <>
      <aside className="relative z-10 flex h-full w-80 flex-col border-r border-zinc-800 bg-zinc-950/70">
        <div className="flex h-18 items-center gap-3 border-b border-zinc-800 px-6 animate-fade">
          <img
            src={usuario?.avatarUrl || "/default-avatar.png"}
            onError={(e) => {
              e.currentTarget.src = "/default-avatar.png";
            }}
            alt="Avatar del usuario"
            className="h-10 w-10 shrink-0 rounded-full object-cover border border-zinc-800"
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
              onClick={() => setMostrarAjustes(true)}
              title="Ajustes"
              aria-label="Ajustes"
              className="rounded-full p-2 text-zinc-300 transition cursor-pointer hover:bg-zinc-800 hover:text-white animate-fade animate-delay-50"
            >
              <LuSettings className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={alCerrarSesion}
              title="Cerrar sesion"
              aria-label="Cerrar sesion"
              className="rounded-full p-2 text-zinc-300 transition cursor-pointer hover:text-red-700 hover:bg-red-700/15
              animate-fade animate-delay-100"
            >
              <LuLogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-2 p-4">
          <button
            onClick={abrirModalCrear}
            className="w-full cursor-pointer rounded-full bg-violet-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500
            animate-fade-right"
          >
            + Nueva Sala
          </button>
          <button
            onClick={abrirModalUnirse}
            className="w-full cursor-pointer rounded-full border border-fuchsia-900 bg-transparent py-2.5 text-sm text-purple-200 transition-colors hover:border-fuchsia-400 hover:text-fuchsia-200
            animate-fade-right animate-delay-100"
          >
            Unirse con Codigo
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto p-4
        animate-fade animate-delay-150"
        >
          <p className="mb-4 px-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
            Tus Chats
          </p>
          {salas.length === 0 ? (
            <div className="rounded-xl italic px-3 py-4 text-center text-xs text-zinc-500">
              Aun no tienes ninguna sala.
            </div>
          ) : (
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
          )}
        </div>
      </aside>

      {mostrarAjustes ? (
        <SettingsModal
          abierto={mostrarAjustes}
          alCerrar={() => setMostrarAjustes(false)}
          configIA={configIA}
          guardando={guardandoConfigIA}
          alActualizarConfigIA={alActualizarConfigIA}
        />
      ) : null}
    </>
  );
}
