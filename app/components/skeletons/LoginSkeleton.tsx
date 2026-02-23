"use client";

import { Skeleton } from "./SkeletonBase";

export function SkeletonLogin() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-transparent text-slate-100 animate-fade">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70rem_45rem_at_8%_-10%,rgba(37,99,235,0.22),transparent_58%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(58rem_36rem_at_88%_-8%,rgba(56,189,248,0.18),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(44rem_32rem_at_50%_108%,rgba(30,64,175,0.16),transparent_62%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-8 animate-fade-up animate-delay-50 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm rounded-3xl border border-zinc-700/50 bg-zinc-900/55 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl animate-fade-up animate-delay-100 sm:max-w-md sm:p-10">
          <div className="mb-8 space-y-4 text-center">
            <Skeleton className="mx-auto h-6 w-32 rounded-full animate-fade-down animate-delay-150" />
            <Skeleton className="mx-auto h-10 w-40 animate-fade-up animate-delay-200" />
            <Skeleton className="mx-auto h-4 w-64 animate-fade-up animate-delay-250" />
          </div>

          <Skeleton className="h-14 w-full rounded-2xl animate-fade-up animate-delay-300" />

          <Skeleton className="mx-auto mt-5 h-3 w-48 animate-fade-up animate-delay-350" />
        </div>
      </section>
    </main>
  );
}
