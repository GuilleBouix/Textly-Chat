// ----------- IMPORTS -----------
import { RefObject } from "react";
import { Mensaje } from "../../types/database";
import MessageBubble from "./MessageBubble";

// ----------- TIPOS -----------
type Perfil = {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
};

interface MessageListProps {
  mensajes: Mensaje[];
  usuarioId: string | undefined;
  perfiles: Record<string, Perfil>;
  finRef: RefObject<HTMLDivElement | null>;
}

// ----------- COMPONENTE -----------
export default function MessageList({
  mensajes,
  usuarioId,
  perfiles,
  finRef,
}: MessageListProps) {
  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
      {mensajes.map((msg) => {
        const esMio = msg.sender_id === usuarioId;
        const perfil = perfiles[msg.sender_id];

        return <MessageBubble key={msg.id} mensaje={msg} esMio={esMio} perfil={perfil} />;
      })}
      <div ref={finRef} />
    </main>
  );
}
