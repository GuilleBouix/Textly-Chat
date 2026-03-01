// ---------------- IMPORTACIONES ----------------
import { LuChevronLeft } from "react-icons/lu";
import UserAvatar from "../ui/UserAvatar";

// ---------------- TIPOS ----------------
interface ChatHeaderProps {
  nombreSala: string | null;
  codigoSala: string | undefined;
  alVolver?: () => void;
  participante2?: {
    nombre?: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
}

// ---------------- COMPONENTE ----------------
export default function ChatHeader({
  nombreSala,
  codigoSala,
  alVolver,
  participante2,
}: ChatHeaderProps) {
  return (
    <header className="flex h-18 items-center justify-between border-b border-zinc-800 px-3 sm:px-4">
      <div className="flex min-w-0 items-center gap-2">
        {alVolver ? (
          <button
            type="button"
            onClick={alVolver}
            aria-label="Volver a la lista de chats"
            className="cursor-pointer rounded-full border border-zinc-700 bg-zinc-900 p-2 text-zinc-200 transition hover:border-violet-500 hover:text-white md:hidden"
          >
            <LuChevronLeft className="h-4 w-4" />
          </button>
        ) : null}

        <div
          className="flex min-w-0 items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 animate-fade sm:px-3"
        >
          <UserAvatar
            src={participante2?.avatarUrl}
            nombre={participante2?.nombre}
            email={participante2?.email}
            alt="Participante 2"
            size="md"
            className="border-zinc-800"
          />
          <p className="max-w-24 truncate text-xs font-medium text-zinc-200 sm:max-w-32">
            {participante2?.nombre || participante2?.email || "Sin participante"}
          </p>
        </div>
      </div>

      <div className="min-w-0 flex items-center gap-1.5 sm:gap-2">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-zinc-100 animate-fade animate-delay-100 sm:text-sm">
          {nombreSala || "Sala sin nombre"}
        </p>
        <p className="text-xs font-mono text-violet-300 animate-fade animate-delay-150 sm:text-sm">
          #{codigoSala}
        </p>
      </div>
    </header>
  );
}

