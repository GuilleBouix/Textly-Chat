"use client";
import { useState } from "react";
import { LuSearch, LuUserPlus, LuCheck, LuLoader } from "react-icons/lu";
import { Perfil } from "../types/database";

interface BuscadorProps {
  onBuscar: (username: string) => Promise<Perfil[]>;
  onAgregar: (id: string) => Promise<void>;
  alCerrar: () => void;
}

export default function UserSearch({
  onBuscar,
  onAgregar,
  alCerrar,
}: BuscadorProps) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Perfil[]>([]);
  const [agregados, setAgregados] = useState<string[]>([]);
  const [buscando, setBuscando] = useState(false);

  const ejecutarBusqueda = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setBuscando(true);
    const users = await onBuscar(query);
    setResultados(users);
    setBuscando(false);
  };

  const manejarAgregar = async (id: string) => {
    try {
      console.log("[chat-debug] UserSearch.manejarAgregar:start", { id });
      await onAgregar(id);
      setAgregados([...agregados, id]);
      console.log("[chat-debug] UserSearch.manejarAgregar:ok", { id });
    } catch (error) {
      console.error("[chat-debug] UserSearch.manejarAgregar:error", error);
      alert("No se pudo enviar la solicitud.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Input de Búsqueda */}
      <form onSubmit={ejecutarBusqueda} className="relative">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Escribe el nombre de usuario..."
          className="w-full bg-zinc-950 border border-zinc-800 p-4 pl-12 rounded-2xl outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
        />
        <LuSearch className="absolute left-4 top-4 text-zinc-500" size={20} />
        {buscando && (
          <LuLoader
            className="absolute right-4 top-4 text-blue-500 animate-spin"
            size={20}
          />
        )}
      </form>

      {/* Resultados */}
      <div className="space-y-2 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
        {resultados.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/50 hover:bg-zinc-900 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-blue-400 border border-zinc-700">
                {user.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold text-zinc-100">
                  {user.username}
                </p>
                <p className="text-[10px] text-zinc-500">{user.email}</p>
              </div>
            </div>

            {agregados.includes(user.id) ? (
              <div className="flex items-center gap-1 text-green-500 text-xs font-medium px-3 py-1.5 bg-green-500/10 rounded-lg">
                <LuCheck size={16} /> Agregado
              </div>
            ) : (
              <button
                onClick={() => manejarAgregar(user.id)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white text-xs font-bold transition-all active:scale-95"
              >
                <LuUserPlus size={16} />
                Solicitar
              </button>
            )}
          </div>
        ))}

        {resultados.length === 0 && query && !buscando && (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">No se encontró a "{query}"</p>
            <p className="text-zinc-700 text-[10px] uppercase mt-1">
              Verifica que el nombre sea exacto
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
