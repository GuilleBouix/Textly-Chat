// ----------- LOGIN SKELETON -----------
export default function LoginSkeleton() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_14%_18%,rgba(168,85,247,0.16),transparent_40%),radial-gradient(circle_at_82%_14%,rgba(217,70,239,0.12),transparent_36%),radial-gradient(circle_at_50%_84%,rgba(126,34,206,0.12),transparent_44%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(88,28,135,0.05)_0%,rgba(17,24,39,0)_45%,rgba(76,29,149,0.05)_100%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-pulse rounded-3xl border border-purple-500/30 bg-linear-to-br from-zinc-950 to-zinc-900 p-8 sm:p-10">
          <div className="mb-7 flex flex-col items-center text-center">
            {/* Logo skeleton */}
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/35 bg-zinc-900 p-2">
              <div className="h-full w-full rounded-xl bg-zinc-800" />
            </div>

            {/* Badge skeleton */}
            <div className="mb-3 h-6 w-24 rounded-full border border-purple-400/35 bg-zinc-900" />

            {/* Title skeleton */}
            <div className="mb-3 h-10 w-48 rounded-lg bg-zinc-800" />

            {/* Description skeleton */}
            <div className="mt-3 h-12 w-full max-w-xs rounded-lg bg-zinc-800" />
          </div>

          {/* Button skeleton */}
          <div className="h-14 w-full rounded-2xl bg-zinc-800" />

          {/* Footer skeleton */}
          <div className="mt-5 h-4 w-40 mx-auto rounded-lg bg-zinc-800" />
        </div>
      </section>
    </main>
  );
}
