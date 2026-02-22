"use client";

import { useState } from "react";

import { LuSearch, LuUserPlus, LuCheck, LuLoader } from "react-icons/lu";
import { Perfil } from "../types/database";
import { normalizeAvatarUrl } from "../lib/avatar";

// ============================================
// TIPOS
// ============================================

type UsuarioBusqueda = Perfil & {
  avatarUrl?: string | null;
};

// ============================================
// PROPS
// ============================================

interface BuscadorProps {
  onBuscar: (username: string) => Promise<UsuarioBusqueda[]>;
  onAgregar: (id: string) => Promise<void>;
  alCerrar: () => void;
}

// ============================================
// COMPONENTE DE BUSQUEDA DE USUARIOS
// ============================================

export default function UserSearch({
  onBuscar,
  onAgregar,
  alCerrar,
}: BuscadorProps) {
  // ============================================
  // ESTADOS
  // ============================================
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<UsuarioBusqueda[]>([]);
  const [agregados, setAgregados] = useState<string[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [aviso, setAviso] = useState("");

  // ============================================
  // FUNCIONES
  // ============================================
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
      setAviso("Solicitud enviada");
      setTimeout(() => setAviso(""), 1800);
      console.log("[chat-debug] UserSearch.manejarAgregar:ok", { id });
    } catch (error) {
      console.error("[chat-debug] UserSearch.manejarAgregar:error", error);
      alert("No se pudo enviar la solicitud.");
    }
  };

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="flex flex-col gap-4">
      {/* Input de busqueda */}
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

      {/* Resultados de la busqueda */}
      <div className="space-y-2 max-h-75 overflow-y-auto pr-2 custom-scrollbar">
        {/* Aviso de solicitud enviada */}
        {aviso && (
          <div className="rounded-xl border border-green-600/30 bg-green-600/10 px-3 py-2 text-xs font-medium text-green-400">
            {aviso}
          </div>
        )}

        {/* Lista de usuarios encontrados */}
        {resultados.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/50 hover:bg-zinc-900 transition-colors"
          >
            {/* Avatar y nombre del usuario */}
            <div className="flex items-center gap-3">
              {user.avatarUrl ? (
                <img
                  src={normalizeAvatarUrl(user.avatarUrl) || user.avatarUrl}
                  alt={user.username || "Usuario"}
                  className="h-10 w-10 rounded-full border border-zinc-700 object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-blue-400 border border-zinc-700">
                  {user.username?.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-zinc-100">
                  {user.username}
                </p>
                <p className="text-[10px] text-zinc-500">{user.email}</p>
              </div>
            </div>

            {/* Boton de accion (agregado o agregar) */}
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
                Agregar
              </button>
            )}
          </div>
        ))}

        {/* Mensaje cuando no se encuentran resultados */}
        {resultados.length === 0 && query && !buscando && (
          <div className="text-center py-8">
            <p className="text-zinc-500 text-sm">No se encontro a {query}</p>
            <p className="text-zinc-700 text-[10px] uppercase mt-1">
              Verifica que el nombre sea exacto
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
