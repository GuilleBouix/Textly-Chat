// ---------------- IMPORTACIONES ----------------
"use client";
import { useReducer, useRef, useState } from "react";
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

// ---------------- TIPOS ----------------
type EstadoInterfazChat = {
  mostrarModalUnirse: boolean;
  mostrarModalCrear: boolean;
  nombreSalaNueva: string;
  idSalaAEliminar: string | null;
  codigoEntrada: string;
};

type AccionInterfazChat =
  | { type: "setMostrarModalUnirse"; payload: boolean }
  | { type: "setMostrarModalCrear"; payload: boolean }
  | { type: "setNombreSalaNueva"; payload: string }
  | { type: "setIdSalaAEliminar"; payload: string | null }
  | { type: "setCodigoEntrada"; payload: string };

type VistaMobile = "lista" | "chat";

// ---------------- CONSTANTES ----------------
const estadoInicialInterfaz: EstadoInterfazChat = {
  mostrarModalUnirse: false,
  mostrarModalCrear: false,
  nombreSalaNueva: "",
  idSalaAEliminar: null,
  codigoEntrada: "",
};

// ---------------- FUNCIONES ----------------
// Actualiza estado de UI local del chat segun la accion recibida
const reductorInterfazChat = (
  estadoActual: EstadoInterfazChat,
  accion: AccionInterfazChat,
): EstadoInterfazChat => {
  switch (accion.type) {
    case "setMostrarModalUnirse":
      return { ...estadoActual, mostrarModalUnirse: accion.payload };
    case "setMostrarModalCrear":
      return { ...estadoActual, mostrarModalCrear: accion.payload };
    case "setNombreSalaNueva":
      return { ...estadoActual, nombreSalaNueva: accion.payload };
    case "setIdSalaAEliminar":
      return { ...estadoActual, idSalaAEliminar: accion.payload };
    case "setCodigoEntrada":
      return { ...estadoActual, codigoEntrada: accion.payload };
    default:
      return estadoActual;
  }
};

// ---------------- COMPONENTE_PRINCIPAL ----------------
export default function ChatPage() {
  // ---------------- HOOK ----------------
  // Consume el hook principal que orquesta auth, salas, mensajes e IA
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

  // ---------------- ESTADO ----------------
  // Gestiona el estado local de modales y formularios de la interfaz
  const [estadoInterfaz, despacharInterfaz] = useReducer(
    reductorInterfazChat,
    estadoInicialInterfaz,
  );
  const [vistaMobile, setVistaMobile] = useState<VistaMobile>("lista");
  const finMensajesRef = useRef<HTMLDivElement | null>(null);

  // ---------------- VARIABLES_DERIVADAS ----------------
  // Deriva la sala activa y el perfil del otro participante para cabecera
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
  const mostrarListaMobile = vistaMobile === "lista" || !idSalaActiva;
  const mostrarChatMobile = vistaMobile === "chat" && Boolean(idSalaActiva);

  // ---------------- FUNCIONES ----------------
  // Selecciona la sala y, en mobile, muestra la conversacion en pantalla completa
  const handleSeleccionarSala = (id: string): void => {
    setIdSalaActiva(id);
    setVistaMobile("chat");
  };

  // Confirma union de sala por codigo y limpia formulario al completar
  const handleConfirmarUnion = async (): Promise<void> => {
    const resultado = await unirseASala(estadoInterfaz.codigoEntrada);
    if (resultado.success) {
      despacharInterfaz({ type: "setMostrarModalUnirse", payload: false });
      despacharInterfaz({ type: "setCodigoEntrada", payload: "" });
      setVistaMobile("chat");
    } else {
      alert(resultado.error);
    }
  };

  // Confirma eliminacion de sala seleccionada en modal de confirmacion
  const handleConfirmarEliminacion = (): void => {
    if (estadoInterfaz.idSalaAEliminar) {
      eliminarSala(estadoInterfaz.idSalaAEliminar);
      despacharInterfaz({ type: "setIdSalaAEliminar", payload: null });
    }
  };

  // Crea una nueva sala y resetea el estado de creacion local
  const handleConfirmarCreacion = (): void => {
    crearSala(estadoInterfaz.nombreSalaNueva);
    despacharInterfaz({ type: "setMostrarModalCrear", payload: false });
    despacharInterfaz({ type: "setNombreSalaNueva", payload: "" });
  };

  // Envia el mensaje y desplaza al final de la conversacion
  const handleEnviarMensaje = (e: React.FormEvent): void => {
    enviarMensaje(e);
    finMensajesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // ---------------- RETORNO ----------------
  // Renderiza layout principal, barra lateral, chat y modales
  return (
    <div className="relative flex h-dvh overflow-hidden bg-zinc-950 font-sans text-zinc-100 md:h-screen">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(168,85,247,0.16),transparent_38%),radial-gradient(circle_at_78%_14%,rgba(147,51,234,0.12),transparent_35%),radial-gradient(circle_at_60%_82%,rgba(126,34,206,0.14),transparent_40%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(88,28,135,0.08)_0%,rgba(17,24,39,0)_45%,rgba(76,29,149,0.08)_100%)]" />
      </div>

      {/* Sidebar - skeleton or real */}
      {cargando ? (
        <div
          className={`${mostrarListaMobile ? "flex" : "hidden"} flex-1 md:flex md:flex-none`}
        >
          <SidebarSkeleton />
        </div>
      ) : (
        <div
          className={`${mostrarListaMobile ? "flex" : "hidden"} flex-1 md:flex md:flex-none`}
        >
          <Sidebar
            usuario={usuario}
            salas={salas}
            idSalaActiva={idSalaActiva || ""}
            alSeleccionarSala={handleSeleccionarSala}
            alEliminarSala={(id) =>
              despacharInterfaz({ type: "setIdSalaAEliminar", payload: id })
            }
            abrirModalUnirse={() =>
              despacharInterfaz({ type: "setMostrarModalUnirse", payload: true })
            }
            abrirModalCrear={() =>
              despacharInterfaz({ type: "setMostrarModalCrear", payload: true })
            }
            alCerrarSesion={cerrarSesion}
            configIA={configIA}
            guardandoConfigIA={guardandoConfigIA}
            alActualizarConfigIA={actualizarConfigIA}
          />
        </div>
      )}

      {/* Area principal - skeleton or real */}
      <section
        className={`${mostrarChatMobile ? "flex" : "hidden"} relative z-10 flex-1 flex-col bg-zinc-950/65 backdrop-blur-[1px] md:flex`}
      >
        {cargando ? (
          <ChatSkeleton />
        ) : idSalaActiva && salaActiva ? (
          <>
            <ChatHeader
              nombreSala={salaActiva.room_name}
              codigoSala={salaActiva.share_code}
              participante2={participanteOtroPerfil}
              alVolver={() => setVistaMobile("lista")}
            />
            <MessageList
              mensajes={mensajes}
              usuarioId={usuario?.id}
              perfiles={perfiles}
              finRef={finMensajesRef}
            />
            <MessageInput
              valor={nuevoMensaje}
              alCambiar={setNuevoMensaje}
              alEnviar={handleEnviarMensaje}
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
        descripcion="Ingresa el codigo compartido para entrar al chat."
        abierto={estadoInterfaz.mostrarModalUnirse}
        alCerrar={() =>
          despacharInterfaz({ type: "setMostrarModalUnirse", payload: false })
        }
        alConfirmar={handleConfirmarUnion}
        textoConfirmar="Unirme"
      >
        <input
          value={estadoInterfaz.codigoEntrada}
          onChange={(e) =>
            despacharInterfaz({ type: "setCodigoEntrada", payload: e.target.value })
          }
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-center text-lg font-mono tracking-widest uppercase outline-none transition-all focus:border-violet-500"
          placeholder="12345678"
          maxLength={8}
        />
      </Modal>

      {/* Modal: Eliminar sala */}
      <Modal
        titulo="Eliminar esta sala?"
        descripcion="Esto borrara todos los mensajes de forma permanente para ambos participantes."
        abierto={!!estadoInterfaz.idSalaAEliminar}
        alCerrar={() =>
          despacharInterfaz({ type: "setIdSalaAEliminar", payload: null })
        }
        alConfirmar={handleConfirmarEliminacion}
        colorBoton="bg-red-600 hover:bg-red-500"
        textoConfirmar="Eliminar para siempre"
      />

      {/* Modal: Crear sala */}
      <Modal
        titulo="Crear nueva sala"
        descripcion="Dale un nombre a tu sala de chat (maximo 25 caracteres)."
        abierto={estadoInterfaz.mostrarModalCrear}
        alCerrar={() => {
          despacharInterfaz({ type: "setMostrarModalCrear", payload: false });
          despacharInterfaz({ type: "setNombreSalaNueva", payload: "" });
        }}
        alConfirmar={handleConfirmarCreacion}
        textoConfirmar="Crear sala"
      >
        <input
          value={estadoInterfaz.nombreSalaNueva}
          onChange={(e) =>
            despacharInterfaz({
              type: "setNombreSalaNueva",
              payload: e.target.value.slice(0, 25),
            })
          }
          className="w-full rounded-xl border border-zinc-800 bg-zinc-950 p-3 text-zinc-100 outline-none transition-all focus:border-violet-500"
          placeholder="Nombre de la sala..."
          maxLength={25}
        />
        <p className="mt-2 text-right text-xs text-zinc-500">
          {estadoInterfaz.nombreSalaNueva.length}/25
        </p>
      </Modal>
    </div>
  );
}
