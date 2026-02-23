"use client";

import {
  LuCheck,
  LuLogOut,
  LuTrash2,
  LuUserPlus,
  LuUsers,
  LuSettings,
} from "react-icons/lu";

import { Sala, UsuarioSupabase } from "../types/database";
import { normalizeAvatarUrl } from "../lib/avatar";

// ============================================
// TIPOS
// ============================================

type PerfilLite = {
  username?: string | null;
  avatarUrl?: string | null;
};

type SolicitudLite = {
  id: string;
  sender_id: string;
  receiver_id: string;
  profiles?: { username?: string | null; email?: string | null }[] | null;
};

// ============================================
// PROPS
// ============================================

interface SidebarProps {
  usuario: UsuarioSupabase | null;
  salas: Sala[];
  idSalaActiva: string;
  perfiles: Record<string, PerfilLite>;
  solicitudesPendientes: SolicitudLite[];
  solicitudesEnviadas: SolicitudLite[];
  mensajesNoLeidos: Record<string, number>;
  alSeleccionarSala: (id: string) => void;
  alEliminarSala: (id: string) => void;
  alAceptarSolicitud: (solicitudId: string, emisorId: string) => Promise<void>;
  alCancelarSolicitud: (solicitudId: string) => Promise<void>;
  abrirModalBuscar: () => void;
  abrirSettings: () => void;
  alCerrarSesion: () => void;
}

// ============================================
// COMPONENTE SIDEBAR
// ============================================

export default function Sidebar({
  usuario,
  salas,
  idSalaActiva,
  perfiles,
  solicitudesPendientes,
  solicitudesEnviadas,
  mensajesNoLeidos,
  alSeleccionarSala,
  alEliminarSala,
  alAceptarSolicitud,
  alCancelarSolicitud,
  abrirModalBuscar,
  abrirSettings,
  alCerrarSesion,
}: SidebarProps) {
  const userMeta = (usuario?.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    typeof userMeta.full_name === "string" ? userMeta.full_name : null;
  const genericName = typeof userMeta.name === "string" ? userMeta.name : null;
  const metaAvatar =
    (typeof userMeta.avatar_url === "string" && userMeta.avatar_url) ||
    (typeof userMeta.picture === "string" && userMeta.picture) ||
    (typeof userMeta.picture_url === "string" && userMeta.picture_url) ||
    (typeof userMeta.photoURL === "string" && userMeta.photoURL) ||
    null;

  const nombrePropio =
    fullName || genericName || usuario?.email?.split("@")[0] || "Usuario";
  const avatarPropio =
    normalizeAvatarUrl(metaAvatar) ||
    `https://ui-avatars.com/api/?name=${usuario?.email || "U"}`;
  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <aside className="flex h-full w-80 flex-col border-r border-zinc-800/80 bg-zinc-950/72 backdrop-blur-md animate-fade-right">
      {/* Header con perfil del usuario */}
      <div className="flex items-center gap-3 border-b border-zinc-800/70 bg-zinc-900/35 p-5 animate-fade-right animate-delay-none">
        {/* Avatar del usuario */}
        <img
          src={avatarPropio}
          className="h-10 w-10 rounded-full border border-zinc-800"
          alt="Mi avatar"
        />

        {/* Nombre y estado */}
        <div className="flex-1 overflow-hidden">
          <p className="truncate text-sm font-bold text-zinc-100">
            {nombrePropio}
          </p>
          <p className="truncate text-[10px] text-emerald-500/80">En linea</p>
        </div>

        {/* Botones de accion */}
        <div className="flex items-center gap-1">
          {/* Boton settings */}
          <button
            onClick={abrirSettings}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            title="Configuracion"
          >
            <LuSettings size={18} />
          </button>

          {/* Boton cerrar sesion */}
          <button
            onClick={alCerrarSesion}
            className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-red-400/10 hover:text-red-400"
            title="Cerrar sesion"
          >
            <LuLogOut size={18} />
          </button>
        </div>
      </div>

      {/* Boton para buscar contactos */}
      <div className="p-4 animate-fade-right animate-delay-50">
        <button
          onClick={abrirModalBuscar}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-600/10 transition-all hover:bg-blue-500"
        >
          <LuUserPlus size={18} />
          Buscar Contactos
        </button>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 animate-fade-right animate-delay-100">
        {/* Seccion de solicitudes */}
        <div className="mb-2 flex items-center gap-2 px-2 animate-fade-right animate-delay-150">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Solicitudes
          </p>
        </div>

        {/* Lista de solicitudes recibidas */}
        <div className="mb-4 space-y-2">
          {solicitudesPendientes.map((solicitud) => {
            const nombre =
              solicitud.profiles?.[0]?.username ||
              perfiles[solicitud.sender_id]?.username ||
              "Usuario";

            const avatar =
              normalizeAvatarUrl(perfiles[solicitud.sender_id]?.avatarUrl) ||
              `https://ui-avatars.com/api/?name=${nombre}`;

            return (
              <div
                key={solicitud.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/45 p-2 backdrop-blur-sm animate-fade-right animate-delay-200"
              >
                <div className="flex min-w-0 items-center gap-2 pr-2">
                  <img
                    src={avatar}
                    className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                    alt={nombre}
                  />

                  <p className="truncate text-xs text-zinc-200">{nombre}</p>
                </div>

                <button
                  onClick={() =>
                    alAceptarSolicitud(solicitud.id, solicitud.sender_id)
                  }
                  className="flex items-center gap-1 rounded-lg bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-500"
                >
                  <LuCheck size={12} />
                  Aceptar
                </button>
              </div>
            );
          })}

          {/* Lista de solicitudes enviadas */}
          {solicitudesEnviadas.map((solicitud) => {
            const nombre =
              solicitud.profiles?.[0]?.username ||
              perfiles[solicitud.receiver_id]?.username ||
              "Usuario";

            const avatar =
              normalizeAvatarUrl(perfiles[solicitud.receiver_id]?.avatarUrl) ||
              `https://ui-avatars.com/api/?name=${nombre}`;

            return (
              <div
                key={solicitud.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-900/45 p-2 backdrop-blur-sm animate-fade-right animate-delay-250"
              >
                <div className="flex min-w-0 items-center gap-2 pr-2">
                  <img
                    src={avatar}
                    className="h-8 w-8 rounded-full border border-zinc-800 object-cover"
                    alt={nombre}
                  />

                  <div className="min-w-0">
                    <p className="truncate text-xs text-zinc-200">{nombre}</p>

                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                      Pendiente
                    </p>
                  </div>
                </div>

                <button
                  onClick={async () => {
                    try {
                      await alCancelarSolicitud(solicitud.id);
                    } catch {
                      alert("No se pudo cancelar la solicitud.");
                    }
                  }}
                  className="rounded-lg bg-zinc-800 px-2 py-1 text-xs font-semibold text-zinc-200 hover:bg-zinc-700"
                >
                  Cancelar
                </button>
              </div>
            );
          })}

          {/* Mensaje cuando no hay solicitudes */}
          {solicitudesPendientes.length === 0 &&
            (solicitudesEnviadas.length === 0 ? (
              <p className="px-2 text-xs italic text-zinc-600">
                No hay solicitudes pendientes.
              </p>
            ) : null)}
        </div>

        {/* Seccion de chats */}
        <div className="mb-4 flex items-center gap-2 px-2 animate-fade-right animate-delay-300">
          <LuUsers size={14} className="text-zinc-500" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            Mis Chats
          </p>
        </div>

        {/* Lista de salas/chats */}
        <div className="space-y-1">
          {salas.map((sala) => {
            const idAmigo =
              sala.participant_1 === usuario?.id
                ? sala.participant_2
                : sala.participant_1;

            const amigo = perfiles[idAmigo];

            const unread = mensajesNoLeidos[sala.id] || 0;

            return (
              <div
                key={sala.id}
                onClick={() => alSeleccionarSala(sala.id)}
                className={`group flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all animate-fade-right animate-delay-350 ${
                  idSalaActiva === sala.id
                    ? "border-zinc-700/90 bg-zinc-900/75 backdrop-blur-sm"
                    : "border-transparent bg-transparent hover:border-zinc-800/60 hover:bg-zinc-900/45"
                }`}
              >
                {/* Avatar con indicador de online */}
                <div className="relative">
                  <img
                    src={
                      normalizeAvatarUrl(amigo?.avatarUrl) ||
                      `https://ui-avatars.com/api/?name=${amigo?.username || "?"}&background=random`
                    }
                    className="h-11 w-11 rounded-full border border-zinc-800 object-cover"
                    alt="avatar"
                  />

                  <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 bg-green-500" />
                </div>

                {/* Nombre y badge de no leidos */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className={`truncate text-sm font-semibold ${
                        idSalaActiva === sala.id
                          ? "text-blue-400"
                          : "text-zinc-200"
                      }`}
                    >
                      {amigo?.username || "Usuario"}
                    </p>
                    {unread > 0 && idSalaActiva !== sala.id && (
                      <span
                        aria-label={`${unread} mensajes nuevos`}
                        className="inline-flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[10px] font-bold text-white"
                      >
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </div>

                  <p className="truncate text-xs text-zinc-500">
                    Haz clic para chatear
                  </p>
                </div>

                {/* Boton eliminar chat */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alEliminarSala(sala.id);
                  }}
                  className="p-2 text-zinc-600 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100"
                >
                  <LuTrash2
                    size={16}
                    title="Eliminar chat"
                    className="cursor-pointer"
                  />
                </button>
              </div>
            );
          })}

          {/* Mensaje cuando no hay chats */}
          {salas.length === 0 && (
            <div className="px-4 py-10 text-center animate-fade-right animate-delay-400">
              <p className="text-xs italic text-zinc-600">
                Aun no tienes chats.
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
