// ---------------- IMPORTACIONES ----------------
import { Mensaje } from "../../types/database";
import { formatearHora } from "../../lib/utils";
import UserAvatar from "../ui/UserAvatar";

// ---------------- TIPOS ----------------
interface PerfilBurbuja {
  id: string;
  email?: string;
  nombre: string;
  avatarUrl: string | null;
}

interface PropiedadesBurbujaMensaje {
  mensaje: Mensaje;
  esMio: boolean;
  perfil?: PerfilBurbuja;
}

// ---------------- COMPONENTE ----------------
// Dibuja un mensaje individual diferenciando estilo propio y remoto
export default function MessageBubble({
  mensaje,
  esMio,
  perfil,
}: PropiedadesBurbujaMensaje) {
  return (
    <div
      className={`flex items-start gap-2 animate-fade animate-delay-200 ${
        esMio ? "justify-end" : "justify-start"
      }`}
    >
      {!esMio && (
        <UserAvatar src={perfil?.avatarUrl} nombre={perfil?.nombre} size="md" />
      )}

      <div
        className={`relative max-w-[85%] rounded-2xl border p-3 text-zinc-100 ${
          esMio
            ? "rounded-tr-md border-violet-500 bg-zinc-900"
            : "rounded-tl-md border-zinc-700 bg-zinc-900"
        }`}
      >
        <p className="text-sm leading-relaxed">{mensaje.content}</p>
        <p
          className={`mt-1 text-[10px] opacity-70 ${
            esMio ? "text-right text-violet-200" : "text-left text-zinc-300"
          }`}
        >
          {formatearHora(mensaje.created_at)}
        </p>
      </div>

      {esMio && (
        <UserAvatar src={perfil?.avatarUrl} nombre={perfil?.nombre} size="md" />
      )}
    </div>
  );
}

