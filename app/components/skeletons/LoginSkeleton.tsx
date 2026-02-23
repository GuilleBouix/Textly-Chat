"use client";

import { Skeleton } from "./SkeletonBase";

export function SkeletonLogin() {
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
            <Skeleton className="mx-auto h-6 w-32 rounded-full" />
            <Skeleton className="mx-auto h-10 w-40" />
            <Skeleton className="mx-auto h-4 w-64" />
          </div>

          <Skeleton className="h-14 w-full rounded-2xl" />

          <Skeleton className="mx-auto mt-5 h-3 w-48" />
        </div>
      </section>
    </main>
  );
}
