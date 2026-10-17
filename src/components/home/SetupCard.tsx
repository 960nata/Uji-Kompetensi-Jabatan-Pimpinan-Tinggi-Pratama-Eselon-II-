"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, GraduationCap, CirclePlay, Timer, TimerOff, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HomeSetupSkeleton } from "@/components/Skeletons";
import { createSession, SECONDS_PER_QUESTION } from "@/lib/quiz";
import { clearActive, loadActive, saveActive } from "@/lib/storage";
import type { Mode, Session } from "@/lib/types";
import { useBank } from "@/lib/useBank";

const COUNTS = [20, 50, 100, 200, 0] as const; // 0 = semua

const MODES: { id: Mode; title: string; desc: string; icon: typeof Trophy }[] = [
  { id: "ujian", title: "Mode Ujian", desc: "Nilai muncul di akhir", icon: Trophy },
  { id: "belajar", title: "Mode Belajar", desc: "Langsung tahu benar/salah", icon: GraduationCap },
];

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

  const answered = active ? active.answers.filter((a) => a !== null).length : 0;

  return (
    <div className="rounded-[28px] border border-line bg-surface p-5 shadow-[0_24px_60px_-32px_rgba(15,23,41,0.35)] sm:p-7">
      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-accent/40 bg-accent-soft p-3.5">
              <CirclePlay className="size-9 shrink-0 text-accent" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold">Ada sesi yang belum selesai</p>
                <p className="tabular text-xs text-muted">
                  {answered}/{active.items.length} terjawab ·{" "}
                  {active.mode === "ujian" ? "Mode Ujian" : "Mode Belajar"}
                </p>
              </div>
              <button
                onClick={() => router.push("/ujian")}
                className="rounded-xl bg-ink px-3.5 py-2 text-sm font-bold text-bg transition active:scale-95"
              >
                Lanjut
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Atur sesi latihan</h2>
          <p className="mt-1 text-sm text-muted">Pilih mode, jumlah soal, dan bagian materi.</p>
        </div>
      </div>

      {error ? (
        <p className="rounded-xl bg-bad-soft p-4 text-sm text-bad">{error}. Muat ulang halaman.</p>
      ) : !bank ? (
        <HomeSetupSkeleton />
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-7">
          {/* Mode */}
          <div className="grid grid-cols-2 gap-2 rounded-2xl bg-surface-2 p-1.5 ring-1 ring-line">
            {MODES.map(({ id, title, desc, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className="relative rounded-xl px-3 py-3 text-left"
                aria-pressed={mode === id}
              >
                {mode === id && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-xl bg-surface shadow-sm ring-1 ring-line"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative flex items-center gap-2 text-sm font-bold">
                  <Icon className={clsx("size-4", mode === id ? "text-brand" : "text-muted")} />
                  {title}
                </span>
                <span className="relative mt-0.5 block text-xs text-muted">{desc}</span>
              </button>
            ))}
          </div>

          {/* Jumlah soal */}
          <fieldset>
            <legend className="mb-3 text-sm font-bold">Jumlah soal</legend>
            <div className="flex flex-wrap gap-2">
              {COUNTS.map((c) => {
                const on = count === c;
                return (
                  <button
                    key={c}
                    onClick={() => setCount(c)}
                    aria-pressed={on}
                    className={clsx(
                      "tabular rounded-full border px-4 py-2 text-sm font-semibold transition active:scale-95",
                      on
                        ? "border-brand bg-brand text-brand-ink"
                        : "border-line bg-surface hover:border-brand/60",
                    )}
                  >
                    {c === 0 ? `Semua (${poolSize})` : c}
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Bagian */}
          <fieldset>
            <legend className="mb-3 flex w-full items-center justify-between text-sm font-bold">
              Bagian materi
              <button
                type="button"
                onClick={() => setSections(bank.sections.map((s) => s.id))}
                className="text-xs font-semibold text-brand"
              >
                Pilih semua
              </button>
            </legend>
            <div className="space-y-2">
              {bank.sections.map((s) => {
                const on = sections.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() => toggleSection(s.id)}
                    aria-pressed={on}
                    className={clsx(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition",
                      on ? "border-brand/50 bg-brand-soft/60" : "border-line hover:border-brand/40",
                    )}
                  >
                    <span
                      className={clsx(
                        "grid size-5 shrink-0 place-items-center rounded-md border transition",
                        on ? "border-brand bg-brand text-brand-ink" : "border-line",
                      )}
                    >
                      {on && <Check className="size-3.5" strokeWidth={3} />}
                    </span>
                    <span className="w-8 shrink-0 font-mono text-xs font-bold text-muted">{s.id}</span>
                    <span className="font-medium leading-snug">{s.title}</span>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Timer */}
          <button
            onClick={() => setTimed((t) => !t)}
            aria-pressed={timed}
            className="flex w-full items-center gap-3 rounded-2xl border border-line p-3.5 text-left transition hover:border-brand/40"
          >
            <span
              className={clsx(
                "grid size-10 place-items-center rounded-xl",
                timed ? "bg-brand-soft text-brand" : "bg-surface-2 text-muted",
              )}
            >
              {timed ? <Timer className="size-5" /> : <TimerOff className="size-5" />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-bold">Batas waktu</span>
              <span className="tabular block text-xs text-muted">
                {timed
                  ? `${Math.round((effective * SECONDS_PER_QUESTION) / 60)} menit · 1 menit per soal`
                  : "Tanpa batas waktu"}
              </span>
            </span>
            <span
              className={clsx(
                "relative h-7 w-12 rounded-full transition-colors",
                timed ? "bg-brand" : "bg-line",
              )}
            >
              <motion.span
                layout
                transition={{ type: "spring", stiffness: 500, damping: 32 }}
                className={clsx(
                  "absolute top-1 size-5 rounded-full bg-white shadow",
                  timed ? "right-1" : "left-1",
                )}
              />
            </span>
          </button>

          <motion.button
            whileTap={{ scale: 0.98 }}
            disabled={starting || !effective}
            onClick={start}
            className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-brand px-6 py-4 text-base font-extrabold text-brand-ink shadow-[0_12px_28px_-12px_var(--brand)] transition disabled:opacity-60"
          >
            {starting ? "Menyiapkan soal…" : `Mulai ${effective} soal`}
            <ArrowRight className="size-5 transition group-hover:translate-x-1" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
