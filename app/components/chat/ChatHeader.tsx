// ----------- IMPORTS -----------
import UserAvatar from "../ui/UserAvatar";

// ----------- TIPOS -----------
interface ChatHeaderProps {
  nombreSala: string | null;
  codigoSala: string | undefined;
  participante2?: {
    nombre?: string;
    email?: string;
    avatarUrl?: string | null;
  } | null;
}

// ----------- COMPONENTE -----------
export default function ChatHeader({
  nombreSala,
  codigoSala,
  participante2,
}: ChatHeaderProps) {
  return (
    <header className="flex h-18 items-center justify-between border-b border-zinc-800 px-4">
      <div
        className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5
      animate-fade"
      >
        <UserAvatar
          src={participante2?.avatarUrl}
          nombre={participante2?.nombre}
          email={participante2?.email}
          alt="Participante 2"
          size="md"
          className="border-zinc-800"
        />
        <p className="max-w-32 truncate text-xs font-medium text-zinc-200">
          {participante2?.nombre || participante2?.email || "Sin participante"}
        </p>
      </div>

      <div className="min-w-0 flex items-center gap-2">
        <p className="truncate text-sm font-semibold text-zinc-100 uppercase tracking-wider animate-fade animate-delay-100">
          {nombreSala || "Sala sin nombre"}
        </p>
        <p className="text-sm font-mono text-violet-300 animate-fade animate-delay-150">
          #{codigoSala}
        </p>
      </div>
    </header>
  );
}
