"use client";

import { AnimatePresence, motion } from "framer-motion";
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
  const [reveal, setReveal] = useState(false);
  const [drafts, setDrafts] = useState<EssayDrafts>({});
  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => setDrafts(loadEssayDrafts()), []);
  useEffect(() => {
    if (bank && order.length === 0) setOrder(shuffle(bank.essay.map((e) => e.id)));
  }, [bank, order.length]);

  const byId = useMemo(() => new Map(bank?.essay.map((e) => [e.id, e]) ?? []), [bank]);

  if (error) return <p className="p-6 text-center text-sm text-bad">{error}</p>;
  if (!bank || order.length === 0) return <EssaySkeleton />;

  const e = byId.get(order[idx])!;
  const text = drafts[e.id] ?? "";
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const points = e.keyPoints
    .split(/;\s*|\.\s+(?=[A-Z])/)
    .map((s) => s.trim().replace(/\.$/, ""))
    .filter(Boolean);

  const go = (n: number) => {
    if (n < 0 || n >= order.length) return;
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
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-4 px-4">
          <Link href="/" className="text-sm text-muted hover:text-ink">
            ← Beranda
          </Link>
          <span className="tabular flex-1 text-center text-sm">
            Essay <span className="font-medium">{idx + 1}</span>
            <span className="text-muted"> / {order.length}</span>
          </span>
          <button
            onClick={() => {
              setOrder(shuffle(bank.essay.map((x) => x.id)));
              setIdx(0);
              setReveal(false);
            }}
            className="text-sm text-muted hover:text-ink"
          >
            Acak
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={e.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <p className="mb-3 text-xs text-muted">Soal no. {e.id}</p>
            <h1 className="text-pretty text-lg font-medium leading-relaxed">{e.question}</h1>

            <div className="mt-6 rounded-lg border border-line focus-within:border-muted">
              <textarea
                value={text}
                onChange={(ev) => update(ev.target.value)}
                placeholder="Tulis jawaban Anda…"
                rows={10}
                className="block w-full resize-y bg-transparent p-4 text-[15px] leading-relaxed outline-none placeholder:text-muted"
              />
              <div className="tabular flex justify-between border-t border-line px-4 py-2 text-xs text-muted">
                <span>{words} kata</span>
                <span>Tersimpan otomatis</span>
              </div>
            </div>

            <button
              onClick={() => setReveal((r) => !r)}
              className="mt-4 text-sm underline underline-offset-4"
            >
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
                  <div className="mt-6 border-l-2 border-ok pl-4">
                    <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                      Pokok jawaban
                    </h2>
                    <ul className="list-disc space-y-1.5 pl-4 text-[15px] leading-relaxed marker:text-muted">
                      {points.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-8">
                    <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                      Bobot penilaian
                    </h2>
                    <table className="w-full text-sm">
                      <tbody className="divide-y divide-line border-y border-line">
                        {RUBRIC.map(([k, w]) => (
                          <tr key={k}>
                            <td className="py-2 pr-4">{k}</td>
                            <td className="tabular py-2 text-right text-muted">{w}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex max-w-2xl gap-2 px-4 py-3">
          <button
            onClick={() => go(idx - 1)}
            disabled={idx === 0}
            className="h-11 flex-1 rounded-lg border border-line text-sm disabled:opacity-30"
          >
            ← Sebelumnya
          </button>
          <button
            onClick={() => go(idx + 1)}
            disabled={idx === order.length - 1}
            className="h-11 flex-1 rounded-lg bg-ink text-sm font-medium text-bg disabled:opacity-30"
          >
            Berikutnya →
          </button>
        </div>
      </nav>
    </div>
  );
}
