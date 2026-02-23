"use client";

import { Skeleton, SkeletonAvatar, SkeletonInput } from "./SkeletonBase";

export function SkeletonChatHeader() {
  return (
    <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 p-3 sm:p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full md:hidden" />
        <div className="flex items-center gap-3">
          <SkeletonAvatar size="md" />
          <div>
            <Skeleton className="h-3 w-12 mb-1" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      </div>
    </header>
  );
}

export function SkeletonMessage({ isMine = false }: { isMine?: boolean }) {
  return (
    <div className={`flex items-start gap-2 ${isMine ? "justify-end" : "justify-start"}`}>
      {!isMine && <SkeletonAvatar size="sm" />}
      <div
        className={`relative max-w-[85%] rounded-2xl p-3 shadow-md ${
          isMine
            ? "rounded-tr-none bg-blue-600"
            : "rounded-tl-none border border-zinc-700 bg-zinc-800"
        }`}
      >
        {!isMine && <Skeleton className="h-3 w-16 mb-2" />}
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-2 w-10 mt-2" />
      </div>
      {isMine && <SkeletonAvatar size="sm" />}
    </div>
  );
}

export function SkeletonChatMessages() {
  return (
    <main className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-3 sm:p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonMessage key={i} isMine={i % 2 === 0} />
      ))}
    </main>
  );
}

export function SkeletonChatInput() {
  return (
    <footer className="p-3 sm:p-4">
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
        <SkeletonInput className="flex-1" />
        <Skeleton className="h-10 w-20 rounded-xl" />
      </div>
    </footer>
  );
}

export function SkeletonChat() {
  return (
    <section className="relative flex min-w-0 flex-1 flex-col bg-zinc-950">
      <SkeletonChatHeader />
      <SkeletonChatMessages />
      <SkeletonChatInput />
    </section>
  );
}
