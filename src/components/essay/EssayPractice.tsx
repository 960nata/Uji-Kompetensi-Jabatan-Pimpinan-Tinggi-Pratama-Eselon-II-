"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Home, Lightbulb, Shuffle } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { EssaySkeleton } from "@/components/Skeletons";
import { shuffle } from "@/lib/quiz";
import { loadEssayDrafts, saveEssayDrafts, type EssayDrafts } from "@/lib/storage";
import { useBank } from "@/lib/useBank";

const RUBRIC = [
  ["Identifikasi masalah & kerangka analisis", 20],
  ["Dasar hukum/kebijakan yang relevan", 20],
  ["Kedalaman analisis (data, pemangku kepentingan, risiko)", 30],
  ["Rekomendasi & rencana tindak lanjut operasional", 20],
  ["Sistematika, bahasa, dan kejelasan", 10],
] as const;

export function EssayPractice() {
  const { bank, error } = useBank();
  const [order, setOrder] = useState<number[]>([]);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);
  const [reveal, setReveal] = useState(false);
  const [drafts, setDrafts] = useState<EssayDrafts>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setDrafts(loadEssayDrafts()), []);
  useEffect(() => {
    if (bank && order.length === 0) setOrder(shuffle(bank.essay.map((e) => e.id)));
  }, [bank, order.length]);

  const byId = useMemo(() => new Map(bank?.essay.map((e) => [e.id, e]) ?? []), [bank]);

  if (error) return <p className="p-6 text-center text-bad">{error}</p>;
  if (!bank || order.length === 0) return <EssaySkeleton />;

  const e = byId.get(order[idx])!;
  const text = drafts[e.id] ?? "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const points = e.keyPoints
    .split(/;\s*|\.\s+(?=[A-Z])/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);
  const done = Object.values(drafts).filter((d) => d.trim()).length;

  const go = (n: number) => {
    if (n < 0 || n >= order.length) return;
    setDir(n > idx ? 1 : -1);
    setIdx(n);
    setReveal(false);
  };

  const update = (v: string) => {
    const next = { ...drafts, [e.id]: v };
    setDrafts(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveEssayDrafts(next), 400);
  };

  return (
    <div className="min-h-dvh pb-28">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link
            href="/"
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface"
            aria-label="Beranda"
          >
            <Home className="size-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="tabular text-sm font-extrabold">
              Essay {idx + 1}
              <span className="font-semibold text-muted"> / {order.length}</span>
            </p>
            <p className="tabular text-xs text-muted">{done} draf tersimpan di perangkat</p>
          </div>
          <button
            onClick={() => {
              setOrder(shuffle(bank.essay.map((x) => x.id)));
              setIdx(0);
              setReveal(false);
            }}
            className="flex h-10 items-center gap-2 rounded-xl border border-line bg-surface px-3 text-sm font-bold"
          >
            <Shuffle className="size-4" /> <span className="hidden sm:inline">Acak ulang</span>
          </button>
        </div>
        <div className="h-1 bg-line/60">
          <motion.div
            className="h-full bg-accent"
            animate={{ width: `${((idx + 1) / order.length) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-3xl overflow-x-clip px-4 py-6">
        <AnimatePresence mode="wait" custom={dir} initial={false}>
          <motion.div
            key={e.id}
            custom={dir}
            initial={{ opacity: 0, x: dir * 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: dir * -40 }}
            transition={{ duration: 0.22 }}
          >
            <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
              Essay & Studi Kasus · No. {e.id}
            </span>
            <h1 className="mt-4 text-pretty text-lg font-semibold leading-relaxed sm:text-xl">{e.question}</h1>

            <div className="mt-6 rounded-2xl border border-line bg-surface focus-within:border-brand">
              <textarea
                value={text}
                onChange={(ev) => update(ev.target.value)}
                placeholder="Tulis jawaban Anda: identifikasi masalah → dasar hukum → analisis → rekomendasi → tindak lanjut…"
                rows={10}
                className="block w-full resize-y rounded-2xl bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted/70"
              />
              <div className="tabular flex items-center justify-between border-t border-line px-4 py-2 text-xs text-muted">
                <span>{words} kata</span>
                <span>Tersimpan otomatis</span>
              </div>
            </div>

            <button
              onClick={() => setReveal((r) => !r)}
              className={clsx(
                "mt-4 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-extrabold transition active:scale-[0.98]",
                reveal ? "border border-line bg-surface" : "bg-ink text-bg",
              )}
            >
              {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              {reveal ? "Sembunyikan pokok jawaban" : "Lihat pokok jawaban"}
            </button>

            <AnimatePresence>
              {reveal && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 rounded-2xl border border-ok/40 bg-ok-soft p-5">
                    <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold text-ok">
                      <Lightbulb className="size-4" /> Pokok-pokok jawaban
                    </h2>
                    <ul className="space-y-2">
                      {points.map((p, i) => (
                        <motion.li
                          key={i}
                          initial={{ opacity: 0, x: -6 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.035 }}
                          className="flex gap-2.5 text-[15px] leading-relaxed"
                        >
                          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ok" />
                          {p}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-3 rounded-2xl border border-line bg-surface p-5">
                    <h2 className="mb-3 text-sm font-extrabold">Pedoman penilaian (bobot)</h2>
                    <ul className="space-y-2.5">
                      {RUBRIC.map(([k, w]) => (
                        <li key={k} className="text-sm">
                          <div className="mb-1 flex justify-between gap-3">
                            <span>{k}</span>
                            <span className="tabular font-bold">{w}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-surface-2">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${(w / 30) * 100}%` }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-3">
          <button
            onClick={() => go(idx - 1)}
            disabled={idx === 0}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl border border-line bg-surface text-sm font-bold disabled:opacity-40"
          >
            <ArrowLeft className="size-4" /> Sebelumnya
          </button>
          <button
            onClick={() => go(idx + 1)}
            disabled={idx === order.length - 1}
            className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-extrabold text-brand-ink disabled:opacity-40"
          >
            Berikutnya <ArrowRight className="size-4" />
          </button>
        </div>
      </nav>
    </div>
  );
}
