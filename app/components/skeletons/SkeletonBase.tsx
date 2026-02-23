// Skeleton base
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md border border-zinc-700/30 bg-zinc-700/35 ${className}`}
      {...props}
    />
  );
}

// Skeleton for avatar
export function SkeletonAvatar({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-24 w-24",
  };

  return <Skeleton className={`rounded-full ${sizeClasses[size]}`} />;
}

// Skeleton for text line
export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"}`}
        />
      ))}
    </div>
  );
}

// Skeleton for button
export function SkeletonButton({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-10 w-full rounded-xl ${className}`} />;
}

// Skeleton for input
export function SkeletonInput({ className = "" }: { className?: string }) {
  return <Skeleton className={`h-12 w-full rounded-xl ${className}`} />;
}
