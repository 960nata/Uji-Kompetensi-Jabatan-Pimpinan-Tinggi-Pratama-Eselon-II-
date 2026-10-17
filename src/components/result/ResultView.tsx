"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { CircleCheck, ChevronDown, Clock, Home, CircleMinus, RotateCcw, CircleX } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/Brand";
import { OptionList } from "@/components/quiz/OptionList";
import { ResultSkeleton } from "@/components/Skeletons";
import { createSession, formatDuration, gradeLabel, isCorrect, LETTERS } from "@/lib/quiz";
import { clearActive, loadResult, saveActive } from "@/lib/storage";
import type { Result } from "@/lib/types";
import { useBank } from "@/lib/useBank";
import { ScoreRing } from "./ScoreRing";

type Filter = "semua" | "salah" | "kosong" | "benar";

const toneColor = { ok: "var(--ok)", brand: "var(--brand)", accent: "var(--accent)", bad: "var(--bad)" };
const toneText = { ok: "text-ok", brand: "text-brand", accent: "text-accent", bad: "text-bad" };

export function ResultView({ id }: { id: string }) {
  const router = useRouter();
  const { bank, error } = useBank();
  const [result, setResult] = useState<Result | null | undefined>(undefined);
  const [filter, setFilter] = useState<Filter>("salah");
  const [open, setOpen] = useState<number | null>(null);
  const [limit, setLimit] = useState(30);

  useEffect(() => {
    const r = loadResult(id);
    setResult(r);
    if (r && r.wrong === 0) setFilter(r.blank ? "kosong" : "semua");
  }, [id]);

  const byId = useMemo(() => (bank ? new Map(bank.mc.map((q) => [q.id, q])) : null), [bank]);

  const rows = useMemo(() => {
    if (!result || !byId) return [];
    return result.items
      .map((item, i) => {
        const q = byId.get(item.qid)!;
        const a = result.answers[i];
        const status: Exclude<Filter, "semua"> =
          a === null ? "kosong" : isCorrect(q, item, a) ? "benar" : "salah";
        return { i, item, q, a, status };
      })
      .filter((r) => filter === "semua" || r.status === filter);
  }, [result, byId, filter]);

  if (error) return <p className="p-6 text-center text-bad">{error}</p>;
  if (result === null)
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="mb-4 text-muted">Hasil tidak ditemukan di perangkat ini.</p>
          <Link href="/" className="rounded-xl bg-brand px-5 py-3 font-bold text-brand-ink">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  if (!bank || !result || !byId)
    return (
      <div className="min-h-dvh">
        <ResultSkeleton />
      </div>
    );

  const g = gradeLabel(result.score);
  const sectionTitle = new Map(bank.sections.map((s) => [s.id, s.title]));

  const retry = () => {
    clearActive();
    saveActive(
      createSession(bank, {
        mode: result.mode,
        count: result.total,
        sections: [...new Set(result.items.map((it) => byId.get(it.qid)!.section))],
        timed: result.durationSec !== null,
      }),
    );
    router.push("/ujian");
  };

  const tiles = [
    { label: "Benar", value: result.correct, icon: CircleCheck, cls: "text-ok bg-ok-soft" },
    { label: "Salah", value: result.wrong, icon: CircleX, cls: "text-bad bg-bad-soft" },
    { label: "Kosong", value: result.blank, icon: CircleMinus, cls: "text-muted bg-surface-2" },
    { label: "Waktu", value: formatDuration(result.elapsedSec), icon: Clock, cls: "text-brand bg-brand-soft" },
  ];

  const counts = {
    semua: result.total,
    salah: result.wrong,
    kosong: result.blank,
    benar: result.correct,
  };

  return (
    <div className="min-h-dvh pb-16">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-4 py-5">
        <Brand />
        <Link
          href="/"
          className="grid size-10 place-items-center rounded-xl border border-line bg-surface"
          aria-label="Beranda"
        >
          <Home className="size-4" />
        </Link>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center gap-6 rounded-[28px] border border-line bg-surface p-6 text-center sm:flex-row sm:p-8 sm:text-left"
        >
          <ScoreRing score={result.score} color={toneColor[g.tone]} />
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted">
              {result.mode === "ujian" ? "Mode Ujian" : "Mode Belajar"} ·{" "}
              {new Date(result.finishedAt).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })}
            </p>
            <h1 className={clsx("mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl", toneText[g.tone])}>
              {g.label}
            </h1>
            <p className="tabular mt-2 text-muted">
              Anda menjawab benar <b className="text-ink">{result.correct}</b> dari{" "}
              <b className="text-ink">{result.total}</b> soal.
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={retry}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-5 text-sm font-extrabold text-brand-ink"
              >
                <RotateCcw className="size-4" /> Ulangi (soal diacak baru)
              </motion.button>
              <Link
                href="/"
                className="flex h-12 items-center justify-center rounded-2xl border border-line px-5 text-sm font-bold"
              >
                Atur sesi baru
              </Link>
            </div>
          </div>
        </motion.section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {tiles.map((t, i) => (
            <motion.div
              key={t.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-2xl border border-line bg-surface p-4"
            >
              <span className={clsx("grid size-9 place-items-center rounded-xl", t.cls)}>
                <t.icon className="size-4" />
              </span>
              <div className="tabular mt-3 text-2xl font-extrabold">{t.value}</div>
              <div className="text-xs font-medium text-muted">{t.label}</div>
            </motion.div>
          ))}
        </div>

        <section className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
          <h2 className="mb-5 text-lg font-extrabold tracking-tight">Nilai per bagian</h2>
          <div className="space-y-4">
            {result.perSection.map((s, i) => {
              const pct = s.total ? (s.correct / s.total) * 100 : 0;
              return (
                <div key={s.id}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                    <span className="min-w-0 font-semibold">
                      <span className="mr-2 font-mono text-xs text-muted">{s.id}</span>
                      {sectionTitle.get(s.id)}
                    </span>
                    <span className="tabular shrink-0 font-bold">
                      {s.correct}/{s.total}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-surface-2 ring-1 ring-line">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: toneColor[gradeLabel(pct).tone] }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + i * 0.08, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-extrabold tracking-tight">Pembahasan</h2>
            <div className="scrollbar-thin -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 sm:mx-0 sm:w-auto sm:px-0">
              <div className="flex gap-1 rounded-2xl bg-surface p-1 ring-1 ring-line">
                {(Object.keys(counts) as Filter[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      setFilter(f);
                      setLimit(30);
                      setOpen(null);
                    }}
                    className="relative shrink-0 rounded-xl px-3.5 py-2 text-sm font-bold capitalize"
                  >
                    {filter === f && (
                      <motion.span
                        layoutId="filter-pill"
                        className="absolute inset-0 rounded-xl bg-ink"
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className={clsx("relative", filter === f ? "text-bg" : "text-muted")}>
                      {f} <span className="tabular opacity-70">{counts[f]}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              Tidak ada soal pada kategori ini.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {rows.slice(0, limit).map(({ i, item, q, a, status }) => {
                const isOpen = open === i;
                const Icon = status === "benar" ? CircleCheck : status === "salah" ? CircleX : CircleMinus;
                return (
                  <li key={i} className="overflow-hidden rounded-2xl border border-line bg-surface">
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-start gap-3 p-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <Icon
                        className={clsx(
                          "mt-0.5 size-5 shrink-0",
                          status === "benar" ? "text-ok" : status === "salah" ? "text-bad" : "text-muted",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="tabular mb-1 block text-xs font-bold text-muted">
                          Soal {i + 1} · Bagian {q.section}
                          {a !== null && ` · Jawaban Anda ${LETTERS[a]}`}
                        </span>
                        <span className={clsx("block text-[15px] leading-relaxed", !isOpen && "line-clamp-2")}>
                          {q.question}
                        </span>
                      </span>
                      <ChevronDown
                        className={clsx("mt-0.5 size-5 shrink-0 text-muted transition", isOpen && "rotate-180")}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="px-4 pb-4">
                            <OptionList q={q} item={item} choice={a} reveal />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
          {rows.length > limit && (
            <button
              onClick={() => setLimit((l) => l + 30)}
              className="mt-4 w-full rounded-2xl border border-line bg-surface py-3.5 text-sm font-bold"
            >
              Tampilkan lebih banyak ({rows.length - limit} lagi)
            </button>
          )}
        </section>
      </main>
    </div>
  );
}
