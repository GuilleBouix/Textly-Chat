"use client";
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabaseClient";

type Room = {
  id?: string | number;
  name?: string;
  [key: string]: unknown;
};

export default function Home() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [status, setStatus] = useState("Conectando...");

  useEffect(() => {
    async function fetchRooms() {
      const { data, error } = await supabase.from("rooms").select("*");

      if (error) {
        console.error("Error conectando a Supabase:", error);
        setStatus("Error de conexion");
        return;
      }

      setRooms((data as Room[]) ?? []);
      setStatus("Conexion exitosa");
    }

    fetchRooms();
  }, []);

  const statusClass =
    status === "Conexion exitosa"
      ? "border-emerald-400/30 bg-emerald-400/15 text-emerald-200"
      : status === "Error de conexion"
        ? "border-rose-400/30 bg-rose-400/15 text-rose-200"
        : "border-sky-400/30 bg-sky-400/15 text-sky-200";

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-112 w-md -translate-x-1/2 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute right-1/4 top-1/3 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-10">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-300">
                Textly Chat
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                Dashboard principal
              </h1>
            </div>
            <span
              className={`inline-flex rounded-full border px-3 py-1 text-xs font-medium ${statusClass}`}
            >
              {status}
            </span>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-900/40 p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-medium text-slate-200">
                Salas detectadas
              </h2>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-slate-200">
                {rooms.length}
              </span>
            </div>

            {rooms.length === 0 ? (
              <p className="text-sm text-slate-400">
                No hay salas para mostrar todavia.
              </p>
            ) : (
              <ul className="space-y-2">
                {rooms.map((room, index) => (
                  <li
                    key={String(room.id ?? index)}
                    className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                  >
                    {String(room.name ?? `Sala ${index + 1}`)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
