// ----------- IMPORTS -----------
// (sin imports adicionales)

// ----------- TIPOS -----------
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

// ----------- COMPONENTE -----------
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

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={`${sizeClass} shrink-0 overflow-hidden rounded-full border border-zinc-700 object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} flex shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 font-bold text-zinc-200 ${className}`}
    >
      {inicial}
    </div>
  );
}
