// ----------- CHAT SKELETON -----------
export default function ChatSkeleton() {
  return (
    <section className="relative z-10 flex flex-1 flex-col bg-zinc-950/65 backdrop-blur-[1px]">
      {/* Header skeleton */}
      <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950/50 p-4">
        <div className="space-y-2">
          <div className="h-3 w-40 animate-pulse rounded-lg bg-zinc-800" />
        </div>
        <div className="space-y-2 text-right">
          <div className="h-3 w-16 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-3 w-24 animate-pulse rounded-lg bg-zinc-800" />
        </div>
      </header>

      {/* Messages skeleton */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={`flex items-start gap-2 ${i % 2 === 0 ? "justify-end" : "justify-start"}`}
          >
            {i % 2 !== 0 && <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-zinc-800" />}
            <div
              className={`max-w-[75%] animate-pulse p-3 rounded-2xl ${
                i % 2 === 0
                  ? "bg-zinc-800 rounded-tr-sm"
                  : "bg-zinc-800 rounded-tl-sm"
              }`}
            >
              <div className={`h-4 ${i % 3 === 0 ? "w-32" : i % 3 === 1 ? "w-48" : "w-40"} rounded-lg bg-zinc-700`} />
              <div className="mt-2 h-3 w-12 rounded-lg bg-zinc-700" />
            </div>
            {i % 2 === 0 && <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-zinc-800" />}
          </div>
        ))}
      </main>

      {/* Input skeleton */}
      <footer className="p-4 bg-linear-to-t from-zinc-950 to-transparent">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 p-2">
          <div className="h-10 flex-1 animate-pulse rounded-xl bg-zinc-800" />
          <div className="h-10 w-20 animate-pulse rounded-xl bg-zinc-800" />
          <div className="h-10 w-14 animate-pulse rounded-xl bg-zinc-800" />
        </div>
      </footer>
    </section>
  );
}
