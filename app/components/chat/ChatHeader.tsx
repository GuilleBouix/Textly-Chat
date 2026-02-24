// ----------- IMPORTS -----------
// (sin imports adicionales)

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
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 p-3.5 backdrop-blur-md">
      <div className="flex items-center gap-2 rounded-full bg-zinc-900/80 px-3 py-1.5">
        <img
          src={participante2?.avatarUrl || "/default-avatar.png"}
          onError={(e) => {
            e.currentTarget.src = "/default-avatar.png";
          }}
          alt="Participante 2"
          className="h-8 w-8 rounded-full object-cover"
        />
        <p className="max-w-32 truncate text-xs font-medium text-zinc-200">
          {participante2?.nombre ||
            participante2?.email ||
            "Esperando participante"}
        </p>
      </div>

      <div className="flex items-center gap-2 min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-100 uppercase tracking-wider">
          {nombreSala || "Sala sin nombre"}
        </p>
        <p className="text-sm font-mono text-blue-400">#{codigoSala}</p>
      </div>
    </header>
  );
}
