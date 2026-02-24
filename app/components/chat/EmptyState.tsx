// ----------- IMPORTS -----------
// (sin imports adicionales)

// ----------- TIPOS -----------
interface EmptyStateProps {
  nombreUsuario: string | undefined;
}

// ----------- COMPONENTE -----------
export default function EmptyState({ nombreUsuario }: EmptyStateProps) {
  const nombreMostrado = nombreUsuario || "Invitado";

  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden p-6 animate-fade-up animate-delay-100 sm:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_24%,rgba(167,139,250,0.2),transparent_52%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-56 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(2,6,23,0.28),transparent_72%)]" />

      <div className="relative w-full max-w-2xl text-center animate-fade-up animate-delay-150">
        <div className="relative mx-auto mb-7 flex h-50 w-50 items-center justify-center rounded-4xl border border-violet-400/25 bg-zinc-900/30 p-5 backdrop-blur-sm animate-flip-up animate-delay-200">
          <div className="pointer-events-none absolute inset-0 rounded-4xl bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.24),transparent_55%)]" />
          <img
            src="/logo.svg"
            alt="Textly Chat"
            className="relative h-full w-full object-contain animate-bounce animate-infinite animate-duration-1500 animate-delay-250"
          />
        </div>

        <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.26em] text-violet-300/90 animate-fade-up animate-delay-300">
          Textly Chat
        </p>
        <h2 className="text-balance text-3xl font-black leading-tight text-zinc-100 [text-shadow:0_2px_16px_rgba(2,6,23,0.55)] animate-fade-up animate-delay-350 sm:text-4xl">
          Bienvenido, {nombreMostrado}
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-pretty text-sm font-light leading-relaxed text-zinc-200/75 [text-shadow:0_2px_10px_rgba(2,6,23,0.5)] animate-fade-up animate-delay-400 sm:text-base">
          Crea o únete a salas de chat para charlar con tus amigos en tiempo
          real.
        </p>
      </div>
    </div>
  );
}
