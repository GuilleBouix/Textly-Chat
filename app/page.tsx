"use client";

import { useEffect, useRef, useState } from "react";
import { LuMenu, LuSparkles } from "react-icons/lu";
import Modal from "./components/Modal";
import Sidebar from "./components/Sidebar";
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

const inicialNombre = (nombre?: string, email?: string) => {
  if (nombre?.trim()) return nombre.trim().charAt(0).toUpperCase();
  if (email?.trim()) return email.trim().charAt(0).toUpperCase();
  return "?";
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
    crearSala,
    unirseASala,
    eliminarSala,
    mejorarMensajeIA,
    cerrarSesion,
    perfiles,
    errorSalaEliminada,
  } = useChat();

  const [mostrarModalUnirse, setMostrarModalUnirse] = useState(false);
  const [idSalaAEliminar, setIdSalaAEliminar] = useState<string | null>(null);
  const [codigoEntrada, setCodigoEntrada] = useState("");
  const [sidebarCompacto, setSidebarCompacto] = useState(false);
  const [sidebarMobileAbierto, setSidebarMobileAbierto] = useState(false);

  const finMensajesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    finMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, idSalaActiva]);

  useEffect(() => {
    if (!errorSalaEliminada) return;
    alert(errorSalaEliminada + " La pagina se actualizara.");
    window.location.reload();
  }, [errorSalaEliminada]);

  const handleConfirmarUnion = async () => {
    const resultado = await unirseASala(codigoEntrada);
    if (resultado.success) {
      setMostrarModalUnirse(false);
      setCodigoEntrada("");
      setSidebarMobileAbierto(false);
    } else {
      alert(resultado.error);
    }
  };

  const seleccionarSala = (id: string) => {
    setIdSalaActiva(id);
    setSidebarMobileAbierto(false);
  };

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
        alSeleccionarSala={seleccionarSala}
        alEliminarSala={setIdSalaAEliminar}
        abrirModalUnirse={() => setMostrarModalUnirse(true)}
        alCrearSala={crearSala}
        alCerrarSesion={cerrarSesion}
      />

      <section className="relative flex min-w-0 flex-1 flex-col bg-zinc-950">
        {idSalaActiva ? (
          <>
            <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 p-3 backdrop-blur-md sm:p-4">
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-200 transition hover:bg-zinc-800 md:hidden"
                  onClick={() => setSidebarMobileAbierto(true)}
                  title="Abrir menu"
                >
                  <LuMenu />
                </button>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                    Sala Activa
                  </p>
                  <h2 className="text-sm font-bold text-blue-400">
                    #{salas.find((s) => s.id === idSalaActiva)?.share_code}
                  </h2>
                </div>
              </div>

              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-zinc-500">
                  Mi Perfil
                </p>
                <p className="max-w-32 truncate text-xs font-medium">
                  {usuario?.email}
                </p>
              </div>
            </header>

            <main className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
              {mensajes.map((msg) => {
                const esMio = msg.sender_id === usuario?.id;
                const perfil = perfiles[msg.sender_id];
                const inicial = inicialNombre(perfil?.nombre, perfil?.email);

                return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2 ${esMio ? "justify-end" : "justify-start"}`}
                  >
                    {!esMio && (
                      <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                        {perfil?.avatarUrl ? (
                          <img
                            src={perfil.avatarUrl}
                            alt={perfil?.nombre || "Usuario"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-200">
                            {inicial}
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className={`relative max-w-[86%] rounded-2xl p-3 shadow-lg sm:max-w-[75%] ${
                        esMio
                          ? "rounded-tr-sm bg-blue-600 text-white"
                          : "rounded-tl-sm border border-zinc-700 bg-zinc-800 text-zinc-200"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          esMio
                            ? "text-right text-blue-100/80"
                            : "text-left text-zinc-400"
                        }`}
                      >
                        {formatearHora(msg.created_at)}
                      </p>
                    </div>

                    {esMio && (
                      <div className="mt-0.5 h-8 w-8 shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800">
                        {perfil?.avatarUrl ? (
                          <img
                            src={perfil.avatarUrl}
                            alt={perfil?.nombre || "Usuario"}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-200">
                            {inicial}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={finMensajesRef} />
            </main>

            <footer className="bg-linear-to-t from-zinc-950 to-transparent p-3 sm:p-4">
              <div className="relative">
                {cargandoIA && (
                  <div className="pointer-events-none absolute -top-14 left-1/2 z-10 -translate-x-1/2 rounded-xl border border-blue-500/40 bg-zinc-900/95 px-4 py-2 shadow-lg shadow-blue-900/30 backdrop-blur-sm">
                    <div className="flex items-center gap-2 text-xs font-medium text-blue-200">
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-300/40 border-t-blue-300" />
                      <span>
                        Mejorando redaccion
                        <span className="ml-0.5 inline-flex">
                          <span className="animate-pulse [animation-delay:0ms]">
                            .
                          </span>
                          <span className="animate-pulse [animation-delay:180ms]">
                            .
                          </span>
                          <span className="animate-pulse [animation-delay:360ms]">
                            .
                          </span>
                        </span>
                      </span>
                    </div>
                  </div>
                )}

                <form
                  onSubmit={enviarMensaje}
                  className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl transition-all focus-within:border-zinc-600"
                >
                  <input
                    value={nuevoMensaje}
                    onChange={(e) => setNuevoMensaje(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="flex-1 bg-transparent p-2 text-sm text-zinc-100 outline-none"
                  />

                  <button
                    type="button"
                    onClick={mejorarMensajeIA}
                    disabled={cargandoIA}
                    className={`rounded-full p-2 transition-all hover:bg-zinc-800 ${cargandoIA ? "animate-pulse" : ""}`}
                    title="Mejorar con IA"
                  >
                    <LuSparkles />
                  </button>

                  <button className="rounded-xl bg-white px-4 py-2 text-sm font-bold text-black transition-transform hover:bg-zinc-200 active:scale-95 sm:px-5">
                    Enviar
                  </button>
                </form>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
            <button
              className="mb-4 inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-200 transition hover:bg-zinc-800 md:hidden"
              onClick={() => setSidebarMobileAbierto(true)}
              title="Abrir menu"
            >
              <LuMenu />
            </button>

            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-zinc-800 bg-zinc-900">
              <span className="text-3xl">?</span>
            </div>
            <h2 className="mb-2 text-xl font-bold">
              Hola, {usuario?.email?.split("@")[0]}!
            </h2>
            <p className="max-w-xs text-sm text-zinc-500">
              Selecciona una conversacion a la izquierda o crea una nueva sala
              para invitar a alguien.
            </p>
          </div>
        )}
      </section>

      <Modal
        titulo="Unirse a una sala"
        descripcion="Ingresa el codigo compartido para entrar al chat."
        abierto={mostrarModalUnirse}
        alCerrar={() => setMostrarModalUnirse(false)}
        alConfirmar={handleConfirmarUnion}
        textoConfirmar="Unirme"
      >
        <input
          autoFocus
          value={codigoEntrada}
          onChange={(e) => setCodigoEntrada(e.target.value)}
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-center font-mono text-lg tracking-widest uppercase outline-none transition-all focus:border-blue-500"
          placeholder="12345678"
          maxLength={8}
        />
      </Modal>

      <Modal
        titulo="Eliminar esta sala?"
        descripcion="Esto borrara todos los mensajes de forma permanente para ambos participantes."
        abierto={!!idSalaAEliminar}
        alCerrar={() => setIdSalaAEliminar(null)}
        alConfirmar={() => {
          if (idSalaAEliminar) eliminarSala(idSalaAEliminar);
          setIdSalaAEliminar(null);
        }}
        colorBoton="bg-red-600"
        textoConfirmar="Eliminar para siempre"
      />
    </div>
  );
}
