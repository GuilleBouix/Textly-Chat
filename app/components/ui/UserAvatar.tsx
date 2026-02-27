"use client";
// ---------------- IMPORTACIONES ----------------
import Image from "next/image";
import { useState } from "react";
import { DEFAULT_AVATAR_SRC, normalizeAvatarUrl } from "../../lib/avatar";

// ---------------- TIPOS ----------------
interface UserAvatarProps {
  src?: string | null;
  alt?: string;
  nombre?: string;
  email?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

// ----------- UTILIDADES -----------
const obtenerInicial = (nombre?: string, email?: string): string => {
  if (nombre?.trim()) return nombre.trim().charAt(0).toUpperCase();
  if (email?.trim()) return email.trim().charAt(0).toUpperCase();
  return "?";
};

const sizeClasses = {
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
};

interface AvatarImageProps {
  initialSrc: string | null;
  alt: string;
}

const AvatarImage = ({ initialSrc, alt }: AvatarImageProps) => {
  const [srcActual, setSrcActual] = useState<string>(initialSrc || DEFAULT_AVATAR_SRC);
  const [ocultarImagen, setOcultarImagen] = useState(false);

  if (ocultarImagen) return null;

  return (
    <Image
      fill
      unoptimized
      sizes="40px"
      src={srcActual}
      alt={alt}
      onError={() => {
        if (srcActual !== DEFAULT_AVATAR_SRC) {
          setSrcActual(DEFAULT_AVATAR_SRC);
          return;
        }
        setOcultarImagen(true);
      }}
      className="relative z-10 object-cover"
    />
  );
};

// ---------------- COMPONENTE ----------------
export default function UserAvatar({
  src,
  alt = "Usuario",
  nombre,
  email,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const inicial = obtenerInicial(nombre, email);
  const sizeClass = sizeClasses[size];
  const normalizedSrc = normalizeAvatarUrl(src);

  return (
    <div
      className={`${sizeClass} relative shrink-0 overflow-hidden rounded-full border border-zinc-700 bg-zinc-800 ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center font-bold text-zinc-200">
        {inicial}
      </span>
      <AvatarImage key={normalizedSrc || "default"} initialSrc={normalizedSrc} alt={alt} />
    </div>
  );
}

