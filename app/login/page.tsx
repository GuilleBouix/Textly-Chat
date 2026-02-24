"use client";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const manejarLoginGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) console.error("Error al iniciar sesion:", error.message);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(168,85,247,0.22),transparent_40%),radial-gradient(circle_at_82%_14%,rgba(217,70,239,0.18),transparent_36%),radial-gradient(circle_at_50%_84%,rgba(126,34,206,0.18),transparent_44%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(88,28,135,0.08)_0%,rgba(17,24,39,0)_45%,rgba(76,29,149,0.08)_100%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-zinc-900/65 p-8 shadow-[0_24px_80px_rgba(76,29,149,0.28)] backdrop-blur-xl sm:p-10">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="relative mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/35 bg-zinc-900/80 p-2">
              <div className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_30%_20%,rgba(168,85,247,0.25),transparent_58%)]" />
              <img
                src="/logo.svg"
                alt="Textly Chat"
                className="relative h-full w-full object-contain"
              />
            </div>

            <span className="mb-3 inline-flex rounded-full border border-purple-400/35 bg-purple-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-200">
              Textly Chat
            </span>

            <h1 className="text-3xl font-black leading-tight text-zinc-100 sm:text-4xl">
              Inicia sesion
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-300 sm:text-base">
              Accede a tus chats en segundos con una experiencia rapida y
              segura.
            </p>
          </div>

          <button
            onClick={manejarLoginGoogle}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-3.5 text-sm font-bold text-white transition-all hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 active:scale-[0.99]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5 rounded-full bg-white p-0.5"
              aria-hidden="true"
            >
              <path
                fill="#EA4335"
                d="M24 9.5c3.53 0 6.71 1.22 9.2 3.6l6.86-6.86C35.87 2.46 30.3 0 24 0 14.64 0 6.55 5.38 2.56 13.22l7.97 6.19C12.46 13.44 17.73 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.14-3.09-.4-4.55H24v8.61h12.95c-.56 3-2.24 5.55-4.77 7.26l7.73 6c4.53-4.17 7.07-10.31 7.07-17.32z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59A14.5 14.5 0 0 1 9.5 24c0-1.6.28-3.14.78-4.59l-7.97-6.19A24 24 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.3 0 11.58-2.08 15.44-5.66l-7.73-6c-2.15 1.45-4.9 2.31-7.71 2.31-6.27 0-11.54-3.94-13.47-9.41l-7.97 6.19C6.55 42.62 14.64 48 24 48z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <p className="mt-5 text-center text-xs text-zinc-400">
            Al continuar aceptas nuestros terminos y politicas de privacidad.
          </p>
        </div>
      </section>
    </main>
  );
}
