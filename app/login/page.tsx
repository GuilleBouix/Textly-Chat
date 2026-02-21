"use client";
import { supabase } from "../lib/supabaseClient";

export default function LoginPage() {
  const manejarLoginGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        // Supabase usará automáticamente el Site URL configurado o esta:
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) console.error("Error al iniciar sesión:", error.message);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/30 backdrop-blur-xl sm:max-w-md sm:p-10">
          <div className="mb-8 space-y-4 text-center">
            <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide text-slate-200">
              Bienvenido a Textly
            </span>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Inicia sesion
            </h1>
            <p className="text-sm text-slate-300 sm:text-base">
              Accede a tus chats en segundos con una experiencia rapida y
              segura.
            </p>
          </div>

          <button
            onClick={manejarLoginGoogle}
            className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3.5 text-sm font-semibold text-slate-900 transition hover:scale-[1.01] hover:bg-slate-100 active:scale-[0.99]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="h-5 w-5"
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

          <p className="mt-5 text-center text-xs text-slate-400">
            Al continuar aceptas nuestros terminos y politicas de privacidad.
          </p>
        </div>
      </section>
    </main>
  );
}
