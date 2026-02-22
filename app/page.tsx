"use client";
import { useEffect, useRef, useState } from "react";
import { LuMenu, LuSparkles, LuUser } from "react-icons/lu";
import Modal from "./components/Modal";
import Sidebar from "./components/Sidebar";
import UserSearch from "./components/UserSearch";
import { useChat } from "./hooks/useChat";

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
    salas,
    idSalaActiva,
    setIdSalaActiva,
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    cargandoIA,
    enviarMensaje,
    eliminarSala,
    mejorarMensajeIA,
    cerrarSesion,
    perfiles,
    solicitudesPendientes,
    buscarUsuarios,
    agregarAmigo,
    aceptarSolicitud,
  } = useChat();

  const [mostrarModalBuscar, setMostrarModalBuscar] = useState(false);
  const [idSalaAEliminar, setIdSalaAEliminar] = useState<string | null>(null);
  const [sidebarMobileAbierto, setSidebarMobileAbierto] = useState(false);

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
    <div className="flex h-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100">
      {sidebarMobileAbierto && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setSidebarMobileAbierto(false)}
        />
      )}

      <Sidebar
        usuario={usuario}
        salas={salas}
        idSalaActiva={idSalaActiva || ""}
        perfiles={perfiles}
        solicitudesPendientes={solicitudesPendientes}
        alSeleccionarSala={(id) => {
          setIdSalaActiva(id);
          setSidebarMobileAbierto(false);
        }}
        alEliminarSala={setIdSalaAEliminar}
        alAceptarSolicitud={aceptarSolicitud}
        abrirModalBuscar={() => setMostrarModalBuscar(true)}
        alCerrarSesion={cerrarSesion}
      />

      <section className="relative flex min-w-0 flex-1 flex-col bg-zinc-950">
        {idSalaActiva ? (
          <>
            <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 p-3 backdrop-blur-md sm:p-4">
              <div className="flex items-center gap-3">
                <button
                  className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 md:hidden"
                  onClick={() => setSidebarMobileAbierto(true)}
                >
                  <LuMenu />
                </button>
                <div className="flex items-center gap-3">
                  {perfilAmigo?.avatarUrl ? (
                    <img
                      src={perfilAmigo.avatarUrl}
                      alt={perfilAmigo.username || "Contacto"}
                      className="h-10 w-10 rounded-full border border-blue-500/30 object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-600/20 font-bold text-blue-400">
                      {perfilAmigo?.username?.charAt(0).toUpperCase() || <LuUser />}
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">Chat con</p>
                    <h2 className="text-sm font-bold text-zinc-100">{perfilAmigo?.username || "Cargando..."}</h2>
                  </div>
                </div>
              </div>
            </header>

            <main className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
              {mensajes.map((msg) => {
                const esMio = msg.sender_id === usuario?.id;
                const perfilEmisor = perfiles[msg.sender_id];
                const avatarSrc =
                  perfilEmisor?.avatarUrl ||
                  `https://ui-avatars.com/api/?name=${perfilEmisor?.username || "U"}`;

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${esMio ? "justify-end" : "justify-start"}`}
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
                          ? "rounded-tr-none bg-blue-600 text-white"
                          : "rounded-tl-none border border-zinc-700 bg-zinc-800 text-zinc-200"
                      }`}
                    >
                      {!esMio && (
                        <p className="mb-1 text-[10px] font-bold text-blue-400">{perfilEmisor?.username}</p>
                      )}
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={`mt-1 text-[9px] opacity-60 ${esMio ? "text-right" : "text-left"}`}>
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

            <footer className="p-3 sm:p-4">
              <div className="relative">
                {cargandoIA && (
                  <div className="pointer-events-none absolute -top-14 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-blue-500/40 bg-zinc-900/95 px-4 py-2 shadow-lg shadow-blue-900/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-200">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-300/40 border-t-blue-300" />
                      <span className="inline-flex items-center">
                        Mejorando mensaje
                        <span className="ml-1 inline-flex">
                          <span className="animate-pulse [animation-delay:0ms]">.</span>
                          <span className="animate-pulse [animation-delay:160ms]">.</span>
                          <span className="animate-pulse [animation-delay:320ms]">.</span>
                        </span>
                      </span>
                    </div>
                  </div>
                )}

              <form
                onSubmit={enviarMensaje}
                className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 focus-within:border-zinc-600"
              >
                <input
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent p-2 text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={mejorarMensajeIA}
                  disabled={cargandoIA}
                  className="rounded-full p-2 text-zinc-400 hover:bg-zinc-800"
                >
                  <LuSparkles className={cargandoIA ? "animate-pulse text-blue-400" : ""} />
                </button>
                <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black hover:bg-zinc-200">
                  Enviar
                </button>
              </form>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
              <LuUser size={40} className="text-zinc-700" />
            </div>
            <h2 className="text-xl font-bold">Bienvenido, {usuario?.user_metadata?.full_name || "Crack"}</h2>
            <p className="mt-2 text-sm text-zinc-500">Busca a un amigo para comenzar a chatear.</p>
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
          onAgregar={async (id) => {
            await agregarAmigo(id);
            setMostrarModalBuscar(false);
          }}
          alCerrar={() => setMostrarModalBuscar(false)}
        />
      </Modal>

      <Modal
        titulo="Eliminar chat?"
        descripcion="Se borraran todos los mensajes de esta conversacion."
        abierto={!!idSalaAEliminar}
        alCerrar={() => setIdSalaAEliminar(null)}
        alConfirmar={() => {
          if (idSalaAEliminar) eliminarSala(idSalaAEliminar);
          setIdSalaAEliminar(null);
        }}
        colorBoton="bg-red-600"
        textoConfirmar="Eliminar"
      />
    </div>
  );
}
