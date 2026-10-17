function Bone({ className = "", style }: { className?: string; style?: React.CSSProperties }) {
  return <div aria-hidden className={`skeleton ${className}`} style={style} />;
}

export function QuizSkeleton() {
  return (
    <div className="min-h-dvh" role="status" aria-label="Memuat soal">
      <div className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Bone className="h-4 w-16" />
          <Bone className="h-4 w-14" />
        </div>
      </div>
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-8 lg:grid-cols-[1fr_260px]">
        <div className="max-w-2xl space-y-6">
          <Bone className="h-3 w-24" />
          <div className="space-y-2.5">
            <Bone className="h-5 w-full" />
            <Bone className="h-5 w-4/5" />
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-line px-4 py-3.5">
                <Bone className="h-4 w-4" />
                <Bone className="h-4" style={{ width: `${45 + ((i * 17) % 40)}%` }} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:block">
          <Bone className="mb-4 h-3 w-20" />
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: 30 }).map((_, i) => (
              <Bone key={i} className="aspect-square" />
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
    <div className="mx-auto max-w-2xl space-y-8 px-4 py-10" role="status" aria-label="Memuat hasil">
      <div className="space-y-3">
        <Bone className="h-3 w-32" />
        <Bone className="h-14 w-28" />
        <Bone className="h-4 w-64" />
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-3 w-full" />
        ))}
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <Bone key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export function HomeSetupSkeleton() {
  return (
    <div className="space-y-8" role="status" aria-label="Memuat">
      <div className="grid grid-cols-2 gap-2">
        <Bone className="h-16" />
        <Bone className="h-16" />
      </div>
      <Bone className="h-10 w-full" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Bone key={i} className="h-10 w-full" />
        ))}
      </div>
      <Bone className="h-11 w-full" />
    </div>
  );
}

export function EssaySkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-10" role="status" aria-label="Memuat essay">
      <Bone className="h-3 w-24" />
      <Bone className="h-5 w-full" />
      <Bone className="h-5 w-3/4" />
      <Bone className="h-56 w-full" />
    </div>
  );
}
