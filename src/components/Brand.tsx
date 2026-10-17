import Link from "next/link";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`relative grid size-9 shrink-0 place-items-center rounded-xl bg-brand text-brand-ink shadow-[0_6px_16px_-6px_var(--brand)] ${className}`}
    >
      <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={2}>
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <circle cx="9" cy="11" r="2" />
        <path d="M6.5 16c.6-1.4 1.6-2 2.5-2s1.9.6 2.5 2" strokeLinecap="round" />
        <path d="M14 10h4M14 13.5h3" strokeLinecap="round" />
      </svg>
      <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full border-2 border-bg bg-accent" />
    </span>
  );
}

export function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <BrandMark />
      <span className="leading-tight">
        <span className="block text-[15px] font-extrabold tracking-tight">Simulasi JPT</span>
        <span className="block text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
          Dukcapil · 2026
        </span>
      </span>
    </Link>
  );
}
