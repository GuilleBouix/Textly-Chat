// ----------- IMPORTS -----------
"use client";
import { useRef, useState } from "react";
import { useChat } from "./hooks/useChat";
import { Sidebar } from "./components/sidebar";
import {
  ChatHeader,
  MessageList,
  MessageInput,
  EmptyState,
} from "./components/chat";
import { Modal } from "./components/ui";
import { SidebarSkeleton, ChatSkeleton } from "./components/skeletons";

// ----------- COMPONENTE PRINCIPAL -----------
export default function ChatPage() {
  // Hook principal de chat
  const {
    cargando,
    usuario,
    salas,
    idSalaActiva,
    setIdSalaActiva,
    mensajes,
    nuevoMensaje,
    setNuevoMensaje,
    cargandoIA,
    accionIAEnCurso,
    enviarMensaje,
    crearSala,
    unirseASala,
    eliminarSala,
    mejorarMensajeIA,
    traducirMensajeIA,
    configIA,
    guardandoConfigIA,
    actualizarConfigIA,
    asistenteIAActivo,
    perfiles,
    cerrarSesion,
  } = useChat();

  // Estados de UI
  const [mostrarModalUnirse, setMostrarModalUnirse] = useState(false);
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [nombreSalaNueva, setNombreSalaNueva] = useState("");
  const [idSalaAEliminar, setIdSalaAEliminar] = useState<string | null>(null);
  const [codigoEntrada, setCodigoEntrada] = useState("");
  const finMensajesRef = useRef<HTMLDivElement | null>(null);

  // Obtener sala activa
  const salaActiva = salas.find((s) => s.id === idSalaActiva);
  const idParticipanteOtro =
    salaActiva && usuario?.id
      ? salaActiva.participant_1 === usuario.id
        ? salaActiva.participant_2
        : salaActiva.participant_1
      : null;
  const participanteOtroPerfil = idParticipanteOtro
    ? perfiles[idParticipanteOtro]
    : null;

  // Funciones handler
  const handleConfirmarUnion = async (): Promise<void> => {
    const resultado = await unirseASala(codigoEntrada);
    if (resultado.success) {
      setMostrarModalUnirse(false);
      setCodigoEntrada("");
    } else {
      alert(resultado.error);
    }
  };

  const handleConfirmarEliminacion = (): void => {
    if (idSalaAEliminar) {
      eliminarSala(idSalaAEliminar);
      setIdSalaAEliminar(null);
    }
  };

  const handleConfirmarCreacion = (): void => {
    crearSala(nombreSalaNueva);
    setMostrarModalCrear(false);
    setNombreSalaNueva("");
  };

  const handleEnviarMensaje = (e: React.FormEvent): void => {
    enviarMensaje(e);
    finMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Render
  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(168,85,247,0.16),transparent_38%),radial-gradient(circle_at_78%_14%,rgba(147,51,234,0.12),transparent_35%),radial-gradient(circle_at_60%_82%,rgba(126,34,206,0.14),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(88,28,135,0.08)_0%,rgba(17,24,39,0)_45%,rgba(76,29,149,0.08)_100%)]" />
      </div>

      {/* Sidebar - skeleton or real */}
      {cargando ? <SidebarSkeleton /> : (
        <Sidebar
          usuario={usuario}
          salas={salas}
          idSalaActiva={idSalaActiva || ""}
          alSeleccionarSala={setIdSalaActiva}
          alEliminarSala={setIdSalaAEliminar}
          abrirModalUnirse={() => setMostrarModalUnirse(true)}
          abrirModalCrear={() => setMostrarModalCrear(true)}
          alCerrarSesion={cerrarSesion}
          configIA={configIA}
          guardandoConfigIA={guardandoConfigIA}
          alActualizarConfigIA={actualizarConfigIA}
        />
      )}

      {/* Área principal - skeleton or real */}
      <section className="relative z-10 flex flex-1 flex-col bg-zinc-950/65 backdrop-blur-[1px]">
        {cargando ? (
          <ChatSkeleton />
        ) : idSalaActiva && salaActiva ? (
          <>
            <ChatHeader
              nombreSala={salaActiva.room_name}
              codigoSala={salaActiva.share_code}
              participante2={participanteOtroPerfil}
            />
            <MessageList
              mensajes={mensajes}
              usuarioId={usuario?.id}
              perfiles={perfiles}
              finRef={finMensajesRef}
            />
            <MessageInput
              value={nuevoMensaje}
              onChange={setNuevoMensaje}
              onSubmit={handleEnviarMensaje}
              onMejorar={mejorarMensajeIA}
              onTraducir={traducirMensajeIA}
              asistenteIAActivo={asistenteIAActivo}
              cargandoIA={cargandoIA}
              accionIAEnCurso={accionIAEnCurso}
            />
          </>
        ) : (
          <EmptyState nombreUsuario={usuario?.nombre || usuario?.username} />
        )}
      </section>

      {/* Modal: Unirse a sala */}
      <Modal
        titulo="Unirse a una sala"
        descripcion="Ingresa el código compartido para entrar al chat."
        abierto={mostrarModalUnirse}
        alCerrar={() => setMostrarModalUnirse(false)}
        alConfirmar={handleConfirmarUnion}
        textoConfirmar="Unirme"
      >
        <input
          autoFocus
          value={codigoEntrada}
          onChange={(e) => setCodigoEntrada(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none focus:border-violet-500 transition-all font-mono tracking-widest uppercase text-center text-lg"
          placeholder="12345678"
          maxLength={8}
        />
      </Modal>

      {/* Modal: Eliminar sala */}
      <Modal
        titulo="¿Eliminar esta sala?"
        descripcion="Esto borrará todos los mensajes de forma permanente para ambos participantes."
        abierto={!!idSalaAEliminar}
        alCerrar={() => setIdSalaAEliminar(null)}
        alConfirmar={handleConfirmarEliminacion}
        colorBoton="bg-red-600 hover:bg-red-500"
        textoConfirmar="Eliminar para siempre"
      />

      {/* Modal: Crear sala */}
      <Modal
        titulo="Crear nueva sala"
        descripcion="Dale un nombre a tu sala de chat (máximo 25 caracteres)."
        abierto={mostrarModalCrear}
        alCerrar={() => {
          setMostrarModalCrear(false);
          setNombreSalaNueva("");
        }}
        alConfirmar={handleConfirmarCreacion}
        textoConfirmar="Crear sala"
      >
        <input
          autoFocus
          value={nombreSalaNueva}
          onChange={(e) => setNombreSalaNueva(e.target.value.slice(0, 25))}
          className="w-full bg-zinc-950 border border-zinc-800 p-3 rounded-xl outline-none focus:border-violet-500 transition-all text-zinc-100"
          placeholder="Nombre de la sala..."
          maxLength={25}
        />
        <p className="text-xs text-zinc-500 mt-2 text-right">
          {nombreSalaNueva.length}/25
        </p>
      </Modal>
    </div>
  );
}
