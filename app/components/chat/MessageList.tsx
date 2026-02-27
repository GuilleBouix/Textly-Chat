// ---------------- IMPORTACIONES ----------------
import { RefObject } from "react";
import { Mensaje } from "../../types/database";
import MessageBubble from "./MessageBubble";

// ---------------- TIPOS ----------------
type PerfilListado = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

interface PropiedadesListadoMensajes {
  mensajes: Mensaje[];
  usuarioId: string | undefined;
  perfiles: Record<string, PerfilListado>;
  finRef: RefObject<HTMLDivElement | null>;
}

// ---------------- COMPONENTE ----------------
// Renderiza todos los mensajes de la sala y el ancla de autoscroll final
export default function MessageList({
  mensajes,
  usuarioId,
  perfiles,
  finRef,
}: PropiedadesListadoMensajes) {
  return (
    <main className="custom-scrollbar relative z-10 flex-1 space-y-4 overflow-y-auto bg-transparent p-3 animate-fade animate-delay-150 sm:p-4">
      {mensajes.map((msg) => {
        const esMio = msg.sender_id === usuarioId;
        const perfil = perfiles[msg.sender_id];

        return <MessageBubble key={msg.id} mensaje={msg} esMio={esMio} perfil={perfil} />;
      })}
      <div ref={finRef} />
    </main>
  );
}

