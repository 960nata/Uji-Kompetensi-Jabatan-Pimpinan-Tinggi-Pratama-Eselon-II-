function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={`skeleton ${className}`} style={style} />;
}

export function QuizSkeleton() {
  return (
    <div className="min-h-dvh" role="status" aria-label="Memuat soal">
      <div className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
          <Bone className="size-10 rounded-xl" />
          <Bone className="h-5 w-28" />
          <Bone className="h-10 w-24 rounded-full" />
        </div>
        <Bone className="h-1 w-full rounded-none" />
      </div>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <Bone className="h-6 w-40 rounded-full" />
          <div className="space-y-2.5">
            <Bone className="h-6 w-full" />
            <Bone className="h-6 w-11/12" />
            <Bone className="h-6 w-2/3" />
          </div>
          <div className="space-y-3 pt-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                <Bone className="size-9 shrink-0 rounded-xl" />
                <Bone className="h-4" style={{ width: `${55 + ((i * 17) % 40)}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden rounded-3xl border border-line bg-surface p-5 lg:block">
          <Bone className="mb-4 h-5 w-32" />
          <div className="grid grid-cols-6 gap-2">
            {Array.from({ length: 30 }).map((_, i) => (
              <Bone key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        </div>
      </div>
      <span className="sr-only">Memuat soal…</span>
    </div>
  );
}

export function ResultSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8" role="status" aria-label="Memuat hasil">
      <div className="flex flex-col items-center gap-5 rounded-3xl border border-line bg-surface p-8 sm:flex-row">
        <Bone className="size-40 shrink-0 rounded-full" />
        <div className="w-full space-y-3">
          <Bone className="h-5 w-32" />
          <Bone className="h-9 w-56" />
          <Bone className="h-4 w-full" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Bone key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Bone key={i} className="h-20 rounded-2xl" />
      ))}
    </div>
  );
}

export function HomeSetupSkeleton() {
  return (
    <div className="space-y-5" role="status" aria-label="Memuat">
      <Bone className="h-12 w-full rounded-2xl" />
      <Bone className="h-5 w-32" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-10 w-20 rounded-full" />
        ))}
      </div>
      <Bone className="h-5 w-40" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-12 w-full rounded-xl" />
        ))}
      </div>
      <Bone className="h-14 w-full rounded-2xl" />
    </div>
  );
}

export function EssaySkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-4 py-8" role="status" aria-label="Memuat essay">
      <Bone className="h-6 w-36 rounded-full" />
      <Bone className="h-7 w-full" />
      <Bone className="h-7 w-3/4" />
      <Bone className="h-64 w-full rounded-2xl" />
      <Bone className="h-14 w-full rounded-2xl" />
    </div>
  );
}
