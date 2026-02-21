"use client";
import { useEffect, useRef, useState } from "react";
import { useChat } from "./hooks/useChat";
import Sidebar from "./components/Sidebar";
import Modal from "./components/Modal";

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
    perfiles,
    errorSalaEliminada,
  } = useChat();

  const [mostrarModalUnirse, setMostrarModalUnirse] = useState(false);
  const [idSalaAEliminar, setIdSalaAEliminar] = useState<string | null>(null);
  const [codigoEntrada, setCodigoEntrada] = useState("");
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
    } else {
      alert(resultado.error);
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      <Sidebar
        usuario={usuario}
        salas={salas}
        idSalaActiva={idSalaActiva || ""}
        alSeleccionarSala={setIdSalaActiva}
        alEliminarSala={setIdSalaAEliminar}
        abrirModalUnirse={() => setMostrarModalUnirse(true)}
        alCrearSala={crearSala}
      />

      <section className="flex-1 flex flex-col bg-zinc-950 relative">
        {idSalaActiva ? (
          <>
            <header className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950/50 backdrop-blur-md">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Sala Activa
                </p>
                <h2 className="text-sm font-mono font-bold text-blue-400">
                  #{salas.find((s) => s.id === idSalaActiva)?.share_code}
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                  Mi Perfil
                </p>
                <p className="text-xs font-medium">{usuario?.email}</p>
              </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
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
                      className={`relative max-w-[75%] p-3 rounded-2xl shadow-lg ${
                        esMio
                          ? "bg-blue-600 text-white rounded-tr-sm"
                          : "bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700"
                      }`}
                    >
                      <span
                        className={`absolute top-2 h-2.5 w-2.5 rotate-45 ${
                          esMio
                            ? "-right-1.5 bg-blue-600"
                            : "-left-1.5 border-l border-t border-zinc-700 bg-zinc-800"
                        }`}
                      />
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p
                        className={`mt-1 text-[10px] ${esMio ? "text-blue-100/80" : "text-zinc-400"}`}
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

            <footer className="p-4 bg-linear-to-t from-zinc-950 to-transparent">
              <form
                onSubmit={enviarMensaje}
                className="p-2 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-2xl flex items-center gap-2 focus-within:border-zinc-600 transition-all"
              >
                <input
                  value={nuevoMensaje}
                  onChange={(e) => setNuevoMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 bg-transparent outline-none p-2 text-sm text-zinc-100"
                />

                <button
                  type="button"
                  onClick={mejorarMensajeIA}
                  disabled={cargandoIA}
                  className={`p-2 rounded-full hover:bg-zinc-800 transition-all ${cargandoIA ? "animate-pulse" : ""}`}
                  title="Mejorar con IA"
                >
                  *
                </button>

                <button className="bg-white text-black px-5 py-2 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-transform active:scale-95">
                  Enviar
                </button>
              </form>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-zinc-900 rounded-3xl flex items-center justify-center mb-4 border border-zinc-800">
              <span className="text-3xl">?</span>
            </div>
            <h2 className="text-xl font-bold mb-2">
              Hola, {usuario?.email?.split("@")[0]}!
            </h2>
            <p className="text-zinc-500 text-sm max-w-xs">
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
          className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none focus:border-blue-500 transition-all font-mono tracking-widest uppercase text-center text-lg"
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
