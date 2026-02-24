// ----------- SIDEBAR SKELETON -----------
export default function SidebarSkeleton() {
  return (
    <aside className="flex h-full w-80 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Profile section */}
      <div className="flex items-center gap-3 border-b border-zinc-800 p-6">
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-zinc-800" />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="h-4 w-24 animate-pulse rounded-lg bg-zinc-800" />
          <div className="h-3 w-32 animate-pulse rounded-lg bg-zinc-800" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="space-y-2 p-4">
        <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
        <div className="h-10 w-full animate-pulse rounded-xl bg-zinc-800" />
      </div>

      {/* Room list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4 h-4 w-20 animate-pulse rounded-lg bg-zinc-800" />
        <div className="space-y-2.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-zinc-900 bg-zinc-950 p-3.5"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="h-4 w-32 rounded-lg bg-zinc-800" />
                <div className="h-4 w-10 rounded-full bg-zinc-800" />
              </div>
              <div className="h-3 w-20 rounded-lg bg-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}
