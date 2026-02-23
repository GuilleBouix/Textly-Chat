"use client";

import { Skeleton } from "./SkeletonBase";

export function SkeletonSidebar() {
  return (
    <aside className="flex h-full w-80 flex-col border-r border-zinc-800/80 bg-zinc-950/72 backdrop-blur-md animate-fade">
      <div className="flex items-center gap-3 border-b border-zinc-800/70 bg-zinc-900/35 p-5 animate-fade animate-delay-none">
        <Skeleton className="h-10 w-10 rounded-full animate-fade animate-delay-50" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1 animate-fade animate-delay-50" />
          <Skeleton className="h-3 w-16 animate-fade animate-delay-100" />
        </div>
      </div>

      <div className="p-4 animate-fade animate-delay-100">
        <Skeleton className="h-10 w-full rounded-xl animate-fade animate-delay-150" />
      </div>

      <div className="flex-1 overflow-y-auto px-3 animate-fade animate-delay-150">
        <Skeleton className="h-3 w-20 mx-2 mb-3 animate-fade animate-delay-200" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3 animate-fade animate-delay-250">
              <Skeleton className="h-11 w-11 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-28 mb-1" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export function SkeletonChat() {
  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-transparent animate-fade animate-delay-50">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(36rem_24rem_at_75%_0%,rgba(59,130,246,0.12),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/10 to-zinc-950/25" />
      </div>
      <header className="relative z-10 flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/55 p-4 backdrop-blur-md animate-fade animate-delay-100">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-3 w-12 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </header>

      <main className="relative z-10 flex-1 bg-zinc-950/15 p-4 animate-fade animate-delay-150">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 mb-4 animate-fade animate-delay-200 ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className="h-16 w-64 rounded-2xl" />
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
        ))}
      </main>

      <footer className="relative z-10 p-4 animate-fade animate-delay-250">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </footer>
    </section>
  );
}
