"use client";

import { Skeleton } from "./SkeletonBase";

export function SkeletonSidebar() {
  return (
    <aside className="flex h-full w-80 flex-col border-r border-zinc-900 bg-zinc-950">
      <div className="flex items-center gap-3 border-b border-zinc-900 bg-zinc-900/20 p-5">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>

      <div className="p-4">
        <Skeleton className="h-10 w-full rounded-xl" />
      </div>

      <div className="flex-1 overflow-y-auto px-3">
        <Skeleton className="h-3 w-20 mx-2 mb-3" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-3">
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
    <section className="relative flex min-w-0 flex-1 flex-col bg-zinc-950">
      <header className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-950/50 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-3 w-12 mb-1" />
          <Skeleton className="h-4 w-24" />
        </div>
      </header>

      <main className="flex-1 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-start gap-2 mb-4 ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            {i % 2 === 0 && <Skeleton className="h-8 w-8 rounded-full" />}
            <Skeleton className="h-16 w-64 rounded-2xl" />
            {i % 2 !== 0 && <Skeleton className="h-8 w-8 rounded-full" />}
          </div>
        ))}
      </main>

      <footer className="p-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
      </footer>
    </section>
  );
}
