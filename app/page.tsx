"use client";

import { useEffect, useRef, useState } from "react";

import { LuArrowLeft, LuSendHorizontal, LuUser } from "react-icons/lu";

import AiAssistantMenu from "./components/AiAssistantMenu";
import Modal from "./components/Modal";
import Settings from "./components/Settings";
import Sidebar from "./components/Sidebar";
import UserSearch from "./components/UserSearch";
import { SkeletonSidebar, SkeletonChat } from "./components/skeletons";
import { useChat } from "./hooks/useChat";
import { normalizeAvatarUrl } from "./lib/avatar";

const formatearHora = (fechaISO: string) => {
  const fecha = new Date(fechaISO);
  if (Number.isNaN(fecha.getTime())) return "--:--";
  return fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

export default function ChatPage() {
  const {
    usuario,
    cargando,
    salas,
    idSalaActiva,
    setIdSalaActiva,
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    cargandoIA,
    configIA,
    enviarMensaje,
    eliminarSala,
    mejorarMensajeIA,
    traducirMensajeIA,
    accionIAActiva,
    cerrarSesion,
    perfiles,
    solicitudesPendientes,
    solicitudesEnviadas,
    mensajesNoLeidos,
    buscarUsuarios,
    agregarAmigo,
    aceptarSolicitud,
    cancelarSolicitud,
    marcarChatComoLeido,
    actualizarConfigIA,
  } = useChat();

  const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);
  const [mostrarSettings, setMostrarSettings] = useState(false);
  const [idSalaAEliminar, setIdSalaAEliminar] = useState<string | null>(null);

  const finMensajesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const salaActual = salas.find((s) => s.id === idSalaActiva);
  const idAmigo = salaActual
    ? salaActual.participant_1 === usuario?.id
      ? salaActual.participant_2
      : salaActual.participant_1
    : null;

  const perfilAmigo = idAmigo ? perfiles[idAmigo] : null;

  return (
    <div className="relative isolate flex h-screen overflow-hidden bg-[#09090b] text-zinc-100 animate-fade">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(70rem_45rem_at_8%_-10%,rgba(139,92,246,0.22),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(58rem_36rem_at_88%_-8%,rgba(168,85,247,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(44rem_32rem_at_50%_108%,rgba(109,40,217,0.16),transparent_62%)]" />
      </div>

      {cargando ? (
        <div className={`${idSalaActiva ? "hidden md:block" : "block"}`}>
          <SkeletonSidebar />
        </div>
      ) : (
        <div className={`${idSalaActiva ? "hidden md:flex" : "flex"} h-full`}>
          <Sidebar
            usuario={usuario}
            salas={salas}
            idSalaActiva={idSalaActiva || ""}
            perfiles={perfiles}
            solicitudesPendientes={solicitudesPendientes}
            solicitudesEnviadas={solicitudesEnviadas}
            mensajesNoLeidos={mensajesNoLeidos}
            alSeleccionarSala={(id) => {
              setIdSalaActiva(id);
              marcarChatComoLeido(id);
            }}
            alEliminarSala={setIdSalaAEliminar}
            alAceptarSolicitud={aceptarSolicitud}
            alCancelarSolicitud={cancelarSolicitud}
            abrirModalBuscar={() => setMostrarModalBuscar(true)}
            abrirSettings={() => setMostrarSettings(true)}
            alCerrarSesion={cerrarSesion}
            mostrarTabsMobile
          />
        </div>
      )}

      <section
        className={`relative min-w-0 flex-1 flex-col bg-transparent animate-fade animate-delay-50 ${idSalaActiva ? "flex" : "hidden md:flex"}`}
      >
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(36rem_24rem_at_75%_0%,rgba(167,139,250,0.12),transparent_70%)]" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-zinc-950/10 to-zinc-950/25" />
        </div>
        {cargando ? (
          <SkeletonChat />
        ) : idSalaActiva ? (
          <>
            <header className="relative z-10 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/55 p-3 backdrop-blur-md animate-fade animate-delay-100 sm:p-4">
              <div className="flex items-center gap-3 animate-fade animate-delay-150">
                <button
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 md:hidden"
                  onClick={() => setIdSalaActiva(null)}
                  aria-label="Volver a chats"
                >
                  <LuArrowLeft />
                </button>

                <div className="flex items-center gap-3">
                  {perfilAmigo?.avatarUrl ? (
                    <img
                      src={
                        normalizeAvatarUrl(perfilAmigo.avatarUrl) ||
                        `https://ui-avatars.com/api/?name=${perfilAmigo?.username || "U"}`
                      }
                      alt={perfilAmigo.username || "Contacto"}
                      className="h-10 w-10 rounded-full border border-violet-400/30 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-400/30 bg-violet-500/20 font-bold text-violet-300">
                      {perfilAmigo?.username?.charAt(0).toUpperCase() || (
                        <LuUser />
                      )}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                      Chat con
                    </p>
                    <h2 className="text-sm font-bold text-zinc-100">
                      {perfilAmigo?.username || "Cargando..."}
                    </h2>
                  </div>
                </div>
              </div>
            </header>

            <main className="custom-scrollbar relative z-10 flex-1 space-y-4 overflow-y-auto bg-zinc-950/15 p-3 animate-fade animate-delay-150 sm:p-4">
              {mensajes.map((msg) => {
                const esMio = msg.sender_id === usuario?.id;
                const perfilEmisor = perfiles[msg.sender_id];
                const avatarSrc =
                  normalizeAvatarUrl(perfilEmisor?.avatarUrl) ||
                  `https://ui-avatars.com/api/?name=${perfilEmisor?.username || "U"}`;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 animate-fade animate-delay-200 ${esMio ? "justify-end" : "justify-start"}`}
                  >
                    {!esMio && (
                      <img
                        src={avatarSrc}
                        alt={perfilEmisor?.username || "Usuario"}
                        className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                      />
                    )}

                    <div
                      className={`relative max-w-[85%] rounded-2xl p-3 shadow-md ${
                        esMio
                          ? "rounded-tr-none border border-violet-400/30 bg-zinc-900/85 text-zinc-100 shadow-lg shadow-violet-950/30 backdrop-blur-sm"
                          : "rounded-tl-none border border-zinc-600/70 bg-zinc-900/80 text-zinc-100 shadow-lg shadow-black/25 backdrop-blur-sm"
                      }`}
                    >
                      {esMio && (
                        <div className="pointer-events-none absolute inset-0 rounded-2xl rounded-tr-none bg-linear-to-br from-violet-400/10 via-transparent to-violet-300/5" />
                      )}
                      {!esMio && (
                        <div className="pointer-events-none absolute inset-0 rounded-2xl rounded-tl-none bg-linear-to-br from-white/8 via-transparent to-white/3" />
                      )}
                      {!esMio && (
                        <p className="mb-1 text-[10px] font-bold text-zinc-300">
                          {perfilEmisor?.username}
                        </p>
                      )}
                      <p className="relative text-sm leading-relaxed">
                        {msg.content}
                      </p>
                      <p
                        className={`relative mt-1 text-[9px] opacity-60 ${esMio ? "text-right text-violet-200/75" : "text-left"}`}
                      >
                        {formatearHora(msg.created_at)}
                      </p>
                    </div>

                    {esMio && (
                      <img
                        src={avatarSrc}
                        alt={perfilEmisor?.username || "Yo"}
                        className="h-8 w-8 rounded-full border border-zinc-700 object-cover"
                      />
                    )}
                  </div>
                );
              })}
              <div ref={finMensajesRef} />
            </main>

            <footer className="relative z-10 p-3 animate-fade animate-delay-250 sm:p-4">
              <div className="pointer-events-none absolute -top-10 left-0 right-0 h-10 bg-linear-to-b from-transparent to-zinc-950/45" />
              <div className="relative animate-fade animate-delay-300">
                {cargandoIA && (
                  <div className="pointer-events-none absolute -top-14 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-violet-400/40 bg-zinc-900/95 px-4 py-2 shadow-lg shadow-violet-900/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-medium text-violet-200">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-300/40 border-t-violet-300" />
                      <span className="inline-flex items-center">
                        {accionIAActiva === "translate"
                          ? "Traduciendo mensaje"
                          : "Mejorando mensaje"}
                        <span className="ml-1 inline-flex">
                          <span className="animate-pulse ">.</span>
                          <span className="animate-pulse animate-delay-150">
                            .
                          </span>
                          <span className="animate-pulse animate-delay-300">
                            .
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={enviarMensaje}
                  className="relative flex items-center gap-2 rounded-2xl border border-zinc-700/60 bg-zinc-900/70 px-3 py-2 shadow shadow-black/20 backdrop-blur-md transition-all duration-200 focus-within:ring-1 focus-within:ring-violet-400/30 focus-within:shadow-violet-900/30"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-2xl bg-linear-to-r from-violet-400/6 via-transparent to-violet-300/6 opacity-70" />
                  <input
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="relative z-10 flex-1 bg-transparent px-2 py-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500"
                  />

                  {configIA.asistenteActivo && (
                    <AiAssistantMenu
                      onImprove={mejorarMensajeIA}
                      onTranslate={traducirMensajeIA}
                      disabled={cargandoIA}
                    />
                  )}

                  <button className="relative z-10 flex cursor-pointer items-center gap-2 rounded-2xl bg-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-900/30 transition-all hover:bg-violet-400">
                    Enviar
                    <LuSendHorizontal />
                  </button>
                </form>
              </div>
            </footer>
          </>
        ) : (
          <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 animate-fade-up animate-delay-100 sm:p-8">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(167,139,250,0.2),transparent_52%)]" />
            <div className="pointer-events-none absolute inset-x-0 top-1/2 h-56 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.28),transparent_72%)]" />

            <div className="relative w-full max-w-2xl text-center animate-fade-up animate-delay-150">
              <div className="relative mx-auto mb-7 flex h-50 w-50 items-center justify-center rounded-4xl border border-violet-400/25 bg-zinc-900/30 p-5 backdrop-blur-sm animate-flip-up animate-delay-200">
                <div className="pointer-events-none absolute inset-0 rounded-4xl bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.24),transparent_55%)]" />
                <img
                  src="/logo.svg"
                  alt="Textly Chat"
                  className="relative h-full w-full object-contain animate-bounce animate-infinite animate-duration-1500 animate-delay-250"
                />
              </div>

              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-violet-300/90 animate-fade-up animate-delay-300">
                Textly Chat
              </p>
              <h2 className="text-balance text-3xl font-black leading-tight text-zinc-100 [text-shadow:0_2px_16px_rgba(2,6,23,0.55)] animate-fade-up animate-delay-350 sm:text-4xl">
                Bienvenido, {usuario?.user_metadata?.full_name || "Crack"}
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-pretty text-sm font-light leading-relaxed text-zinc-200/75 [text-shadow:0_2px_10px_rgba(2,6,23,0.5)] animate-fade-up animate-delay-400 sm:text-base">
                Busca a un amigo para comenzar a chatear al instante.
              </p>
            </div>
          </div>
        )}
      </section>

      <Modal
        titulo="Buscar Contactos"
        descripcion="Escribe el nombre de usuario de la persona con la que quieres hablar."
        abierto={mostrarModalBuscar}
        alCerrar={() => setMostrarModalBuscar(false)}
        alConfirmar={() => setMostrarModalBuscar(false)}
      >
        <UserSearch
          onBuscar={buscarUsuarios}
          onAgregar={(id) => agregarAmigo(id)}
          alCerrar={() => setMostrarModalBuscar(false)}
        />
      </Modal>

      <Modal
        titulo="Eliminar chat"
        descripcion="Se borraran todos los mensajes de esta conversacion."
        abierto={!!idSalaAEliminar}
        alCerrar={() => setIdSalaAEliminar(null)}
        alConfirmar={() => {
          if (idSalaAEliminar) eliminarSala(idSalaAEliminar);
          setIdSalaAEliminar(null);
        }}
        colorBoton="bg-red-500 hover:bg-red-400 shadow-lg shadow-red-900/30"
        textoConfirmar="Eliminar"
      />

      <Settings
        abierto={mostrarSettings}
        alCerrar={() => setMostrarSettings(false)}
        configIA={configIA}
        alActualizarConfigIA={actualizarConfigIA}
      />
    </div>
  );
}
