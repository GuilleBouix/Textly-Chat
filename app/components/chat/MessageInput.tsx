// ---------------- IMPORTACIONES ----------------
import { LuSend } from "react-icons/lu";
import ChatAIFunctions from "./ChatAIFunctions";

// ---------------- TIPOS ----------------
interface PropiedadesEntradaMensaje {
  valor: string;
  alCambiar: (valor: string) => void;
  alEnviar: (e: React.FormEvent) => void;
  onMejorar: () => void;
  onTraducir: () => void;
  cargandoIA: boolean;
  accionIAEnCurso: "improve" | "translate" | null;
  asistenteIAActivo: boolean;
}

// ---------------- COMPONENTE ----------------
// Renderiza la caja de texto, acciones de IA y botón de envío del chat
export default function MessageInput({
  valor,
  alCambiar,
  alEnviar,
  onMejorar,
  onTraducir,
  cargandoIA,
  accionIAEnCurso,
  asistenteIAActivo,
}: PropiedadesEntradaMensaje) {
  return (
    <footer className="relative bg-transparent p-4">
      {/* Muestra estado visual mientras se procesa acción IA */}
      {cargandoIA ? (
        <div className="mb-3 flex justify-center animate-fade-up animate-delay-none">
          <div className="inline-flex items-center gap-2 rounded-xl border border-violet-500 bg-zinc-900 px-3 py-1.5">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-400 border-t-violet-200" />
            <p className="text-[11px] font-medium text-violet-100">
              {accionIAEnCurso === "translate"
                ? "Traduciendo mensaje"
                : "Mejorando redaccion"}
              <span className="inline-flex w-6 justify-start">
                <span className="animate-pulse">.</span>
                <span className="animate-pulse animation-delay-120ms">.</span>
                <span className="animate-pulse animation-delay-240ms">.</span>
              </span>
            </p>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={alEnviar}
        className="flex items-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 p-2 transition-colors focus-within:border-purple-500"
      >
        <input
          value={valor}
          onChange={(e) => alCambiar(e.target.value)}
          disabled={cargandoIA}
          placeholder="Escribe un mensaje..."
          className="flex-1 rounded-xl bg-transparent p-2 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-60"
        />

        {/* Renderiza controles de mejora y traducción del asistente */}
        <ChatAIFunctions
          cargandoIA={cargandoIA}
          asistenteIAActivo={asistenteIAActivo}
          onMejorar={onMejorar}
          onTraducir={onTraducir}
        />

        <button
          type="submit"
          disabled={cargandoIA}
          aria-label="Enviar mensaje"
          className="flex cursor-pointer items-center gap-2 rounded-full bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* Dispara el submit del formulario de mensaje */}
          Enviar
          <LuSend className="h-3.5 w-3.5" />
        </button>
      </form>
    </footer>
  );
}

