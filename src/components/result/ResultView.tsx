"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Brand } from "@/components/Brand";
import { OptionList } from "@/components/quiz/OptionList";
import { ResultSkeleton } from "@/components/Skeletons";
import { createSession, formatDuration, gradeLabel, isCorrect, LETTERS } from "@/lib/quiz";
import { clearActive, loadResult, loadSeen, saveActive, saveSeen, updateResult } from "@/lib/storage";
import type { Result } from "@/lib/types";
import { useBank } from "@/lib/useBank";

type Filter = "semua" | "salah" | "kosong" | "benar";

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

  if (error) return <p className="p-6 text-center text-sm text-bad">{error}</p>;
  if (result === null)
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center text-sm">
        <div>
          <p className="mb-4 text-muted">Hasil tidak ditemukan di perangkat ini.</p>
          <Link href="/" className="underline underline-offset-4">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    );
  if (!bank || !result || !byId) return <ResultSkeleton />;

  const sectionTitle = new Map(bank.sections.map((s) => [s.id, s.title]));

  const retry = () => {
    clearActive();
    const essayCount = result.essayIds?.length ?? 0;
    const { session, seen } = createSession(
      bank,
      {
        mode: result.mode,
        count: result.total + essayCount,
        sections: [...new Set(result.items.map((it) => byId.get(it.qid)!.section))],
        timed: result.durationSec !== null,
        withEssay: essayCount > 0,
      },
      loadSeen(),
    );
    saveSeen(seen);
    saveActive(session);
    router.push("/ujian");
  };

  const essayIds = result.essayIds ?? [];
  const essayScores = result.essayScores ?? essayIds.map(() => null);
  const rated = essayScores.filter((s): s is number => s !== null);
  const essayAvg = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;
  const essayById = new Map(bank.essay.map((e) => [e.id, e]));

  const rate = (k: number, v: number) => {
    const scores = [...essayScores];
    scores[k] = scores[k] === v ? null : v;
    const next = { ...result, essayScores: scores };
    setResult(next);
    updateResult(next);
  };

  const counts = { salah: result.wrong, kosong: result.blank, benar: result.correct, semua: result.total };

  return (
    <div className="min-h-dvh pb-16">
      <header className="border-b border-line">
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <Brand />
          <Link href="/" className="text-sm text-muted hover:text-ink">
            Beranda
          </Link>
        </div>
      </header>

      <motion.main
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mx-auto max-w-2xl px-4 pt-10"
      >
        <p className="text-xs uppercase tracking-wider text-muted">
          {result.mode === "ujian" ? "Ujian" : "Belajar"} ·{" "}
          {new Date(result.finishedAt).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}
        </p>
        <div className="mt-3 flex items-baseline gap-3">
          <span className="tabular text-6xl font-semibold tracking-tight">{result.score.toFixed(1)}</span>
          <span className="text-sm text-muted">
            {essayIds.length ? "Nilai PG · " : ""}
            {gradeLabel(result.score).label}
          </span>
        </div>
        {essayIds.length > 0 && (
          <p className="tabular mt-1 text-sm text-muted">
            Nilai essay (mandiri):{" "}
            {essayAvg === null ? (
              "belum dinilai"
            ) : (
              <span className="font-medium text-ink">
                {essayAvg.toFixed(1)}
                {rated.length < essayIds.length && ` (${rated.length}/${essayIds.length} dinilai)`}
              </span>
            )}
          </p>
        )}
        <p className="tabular mt-3 text-sm text-muted">
          <span className="text-ok">{result.correct} benar</span> ·{" "}
          <span className="text-bad">{result.wrong} salah</span> · {result.blank} kosong · waktu{" "}
          {formatDuration(result.elapsedSec)}
        </p>

        <div className="mt-6 flex gap-2">
          <button
            onClick={retry}
            className="rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-bg transition hover:opacity-90"
          >
            Ulangi dengan soal baru
          </button>
          <Link href="/" className="rounded-md border border-line px-3.5 py-2 text-sm">
            Atur sesi
          </Link>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-muted">Per bagian</h2>
          <div className="space-y-4">
            {result.perSection.map((s, i) => {
              const pct = s.total ? (s.correct / s.total) * 100 : 0;
              return (
                <div key={s.id}>
                  <div className="mb-1.5 flex justify-between gap-4 text-sm">
                    <span className="min-w-0">
                      <span className="mr-2 font-mono text-xs text-muted">{s.id}</span>
                      {sectionTitle.get(s.id)}
                    </span>
                    <span className="tabular shrink-0 text-muted">
                      {s.correct}/{s.total}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-surface-2">
                    <motion.div
                      className="h-full rounded-full bg-ink"
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {essayIds.length > 0 && (
          <section className="mt-12">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted">Essay · nilai mandiri</h2>
            <p className="mt-1 text-sm text-muted">
              Bandingkan jawaban Anda dengan pokok jawaban, lalu beri nilai sendiri.
            </p>
            <ol className="mt-4 divide-y divide-line border-y border-line">
              {essayIds.map((id, k) => {
                const e = essayById.get(id)!;
                const ans = result.essayAnswers?.[k]?.trim() ?? "";
                return (
                  <li key={id} className="py-5">
                    <p className="tabular mb-1 text-xs text-muted">
                      No. {result.total + k + 1} · soal {id}
                    </p>
                    <p className="text-[15px] font-medium leading-relaxed">{e.question}</p>
                    <div className="mt-3 rounded-lg bg-surface-2 p-3 text-sm leading-relaxed whitespace-pre-wrap">
                      {ans || <span className="text-muted">Tidak dijawab.</span>}
                    </div>
                    <div className="mt-3 border-l-2 border-ok pl-3 text-sm leading-relaxed">
                      <span className="font-medium">Pokok jawaban: </span>
                      <span className="text-muted">{e.keyPoints}</span>
                    </div>
                    <div className="mt-4 flex items-center gap-1.5">
                      <span className="mr-1 text-xs text-muted">Nilai</span>
                      {[0, 25, 50, 75, 100].map((v) => (
                        <button
                          key={v}
                          onClick={() => rate(k, v)}
                          aria-pressed={essayScores[k] === v}
                          className={clsx(
                            "tabular h-8 min-w-10 rounded-md border px-2 text-sm transition",
                            essayScores[k] === v
                              ? "border-ink bg-ink text-bg"
                              : "border-line text-muted hover:border-muted",
                          )}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ol>
          </section>
        )}

        <section className="mt-12">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wider text-muted">Pembahasan PG</h2>
            <div className="flex gap-4 text-sm">
              {(Object.keys(counts) as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => {
                    setFilter(f);
                    setLimit(30);
                    setOpen(null);
                  }}
                  className={clsx(
                    "capitalize underline-offset-[6px]",
                    filter === f ? "text-ink underline" : "text-muted hover:text-ink",
                  )}
                >
                  {f} <span className="tabular text-muted">{counts[f]}</span>
                </button>
              ))}
            </div>
          </div>

          {rows.length === 0 ? (
            <p className="border-y border-line py-8 text-center text-sm text-muted">Tidak ada soal.</p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {rows.slice(0, limit).map(({ i, item, q, a, status }) => {
                const isOpen = open === i;
                return (
                  <li key={i}>
                    <button
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-start gap-3 py-4 text-left"
                      aria-expanded={isOpen}
                    >
                      <span
                        className={clsx(
                          "mt-2 size-1.5 shrink-0 rounded-full",
                          status === "benar" ? "bg-ok" : status === "salah" ? "bg-bad" : "bg-line",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="tabular mb-1 block text-xs text-muted">
                          No. {i + 1} · Bagian {q.section}
                          {a !== null ? ` · jawaban ${LETTERS[a]}` : " · kosong"}
                        </span>
                        <span className={clsx("block text-[15px] leading-relaxed", !isOpen && "line-clamp-2")}>
                          {q.question}
                        </span>
                      </span>
                      <ChevronDown
                        className={clsx("mt-1 size-4 shrink-0 text-muted transition", isOpen && "rotate-180")}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="pb-5 pl-4">
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
              className="mt-4 w-full py-2 text-sm text-muted hover:text-ink"
            >
              Tampilkan {Math.min(30, rows.length - limit)} lagi
            </button>
          )}
        </section>
      </motion.main>
    </div>
  );
}
