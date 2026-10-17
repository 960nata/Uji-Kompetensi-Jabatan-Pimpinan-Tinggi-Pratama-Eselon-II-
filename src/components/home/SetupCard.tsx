"use client";

import clsx from "clsx";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HomeSetupSkeleton } from "@/components/Skeletons";
import { createSession, SECONDS_PER_QUESTION } from "@/lib/quiz";
import { clearActive, loadActive, saveActive } from "@/lib/storage";
import type { Mode, Session } from "@/lib/types";
import { useBank } from "@/lib/useBank";

const COUNTS = [20, 50, 100, 200, 0] as const; // 0 = semua

const MODES: { id: Mode; title: string; desc: string }[] = [
  { id: "ujian", title: "Ujian", desc: "Nilai di akhir" },
  { id: "belajar", title: "Belajar", desc: "Langsung tahu benar/salah" },
];

function Label({ children }: { children: React.ReactNode }) {
  return <div className="mb-2.5 text-xs font-medium uppercase tracking-wider text-muted">{children}</div>;
}

export function SetupCard() {
  const { bank, error } = useBank();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("ujian");
  const [count, setCount] = useState<number>(50);
  const [timed, setTimed] = useState(true);
  const [sections, setSections] = useState<string[]>([]);
  const [active, setActive] = useState<Session | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => setActive(loadActive()), []);
  useEffect(() => {
    if (bank && sections.length === 0) setSections(bank.sections.map((s) => s.id));
  }, [bank, sections.length]);

  const poolSize = useMemo(
    () => (bank ? bank.mc.filter((q) => sections.includes(q.section)).length : 0),
    [bank, sections],
  );
  const effective = count === 0 ? poolSize : Math.min(count, poolSize);

  const toggleSection = (id: string) =>
    setSections((prev) =>
      prev.includes(id) ? (prev.length > 1 ? prev.filter((s) => s !== id) : prev) : [...prev, id],
    );

  const start = () => {
    if (!bank || !effective) return;
    setStarting(true);
    clearActive();
    saveActive(createSession(bank, { mode, count: effective, sections, timed }));
    router.push("/ujian");
  };

  if (error) return <p className="text-sm text-bad">{error}. Muat ulang halaman.</p>;
  if (!bank) return <HomeSetupSkeleton />;

  const answered = active ? active.answers.filter((a) => a !== null).length : 0;

  return (
    <div className="space-y-8">
      {active && (
        <div className="flex items-center justify-between gap-4 rounded-lg border border-line px-4 py-3">
          <div className="text-sm">
            <div className="font-medium">Sesi belum selesai</div>
            <div className="tabular text-muted">
              {answered}/{active.items.length} terjawab · {active.mode === "ujian" ? "Ujian" : "Belajar"}
            </div>
          </div>
          <button
            onClick={() => router.push("/ujian")}
            className="rounded-md border border-line px-3 py-1.5 text-sm font-medium transition hover:bg-surface-2"
          >
            Lanjutkan
          </button>
        </div>
      )}

      <section>
        <Label>Mode</Label>
        <div className="grid grid-cols-2 gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={clsx(
                "rounded-lg border px-4 py-3 text-left transition",
                mode === m.id ? "border-ink" : "border-line hover:border-muted",
              )}
            >
              <div className="text-sm font-medium">{m.title}</div>
              <div className="text-xs text-muted">{m.desc}</div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <Label>Jumlah soal</Label>
        <div className="flex overflow-hidden rounded-lg border border-line">
          {COUNTS.map((c, i) => (
            <button
              key={c}
              onClick={() => setCount(c)}
              aria-pressed={count === c}
              className={clsx(
                "tabular flex-1 py-2.5 text-sm transition",
                i > 0 && "border-l border-line",
                count === c ? "bg-ink font-medium text-bg" : "hover:bg-surface-2",
              )}
            >
              {c === 0 ? "Semua" : c}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between">
          <Label>Bagian materi</Label>
          <button
            onClick={() => setSections(bank.sections.map((s) => s.id))}
            className="text-xs text-muted hover:text-ink"
          >
            Pilih semua
          </button>
        </div>
        <div className="divide-y divide-line rounded-lg border border-line">
          {bank.sections.map((s) => {
            const on = sections.includes(s.id);
            return (
              <label key={s.id} className="flex cursor-pointer items-center gap-3 px-4 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={on}
                  onChange={() => toggleSection(s.id)}
                  className="size-4 shrink-0 accent-[var(--ink)]"
                />
                <span className="w-6 shrink-0 font-mono text-xs text-muted">{s.id}</span>
                <span className={clsx(!on && "text-muted")}>{s.title}</span>
              </label>
            );
          })}
        </div>
      </section>

      <label className="flex cursor-pointer items-center justify-between gap-4 text-sm">
        <span>
          <span className="block font-medium">Batas waktu</span>
          <span className="tabular block text-muted">
            {timed
              ? `${Math.round((effective * SECONDS_PER_QUESTION) / 60)} menit (1 menit/soal)`
              : "Tidak aktif"}
          </span>
        </span>
        <input
          type="checkbox"
          checked={timed}
          onChange={(e) => setTimed(e.target.checked)}
          className="size-4 accent-[var(--ink)]"
        />
      </label>

      <button
        disabled={starting || !effective}
        onClick={start}
        className="tabular w-full rounded-lg bg-ink py-3 text-sm font-medium text-bg transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
      >
        {starting ? "Menyiapkan…" : `Mulai · ${effective} soal`}
      </button>
    </div>
  );
}
