// ----------- IMPORTS -----------
import { Mensaje } from "../../types/database";
import { formatearHora } from "../../lib/utils";
import UserAvatar from "../ui/UserAvatar";

// ----------- TIPOS -----------
interface Perfil {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
}

interface MessageBubbleProps {
  mensaje: Mensaje;
  esMio: boolean;
  perfil?: Perfil;
}

// ----------- COMPONENTE -----------
export default function MessageBubble({
  mensaje,
  esMio,
  perfil,
}: MessageBubbleProps) {
  return (
    <div className={`flex items-start gap-2 ${esMio ? "justify-end" : "justify-start"}`}>
      {/* Avatar del remitente (si no es mío) */}
      {!esMio && <UserAvatar src={perfil?.avatarUrl} nombre={perfil?.nombre} size="md" />}

      {/* Burbuja de mensaje */}
      <div
        className={`relative max-w-[75%] p-3 rounded-2xl shadow-lg ${
          esMio
            ? "bg-blue-600 text-white rounded-tr-sm"
            : "bg-zinc-800 text-zinc-200 rounded-tl-sm border border-zinc-700"
        }`}
      >
        {/* Triángulo indicador */}
        <span
          className={`absolute top-2 h-2.5 w-2.5 rotate-45 ${
            esMio
              ? "-right-1.5 bg-blue-600"
              : "-left-1.5 border-l border-t border-zinc-700 bg-zinc-800"
          }`}
        />
        <p className="text-sm leading-relaxed">{mensaje.content}</p>
        <p className={`mt-1 text-[10px] ${esMio ? "text-blue-100/80" : "text-zinc-400"}`}>
          {formatearHora(mensaje.created_at)}
        </p>
      </div>

      {/* Avatar propio */}
      {esMio && <UserAvatar src={perfil?.avatarUrl} nombre={perfil?.nombre} size="md" />}
    </div>
  );
}
