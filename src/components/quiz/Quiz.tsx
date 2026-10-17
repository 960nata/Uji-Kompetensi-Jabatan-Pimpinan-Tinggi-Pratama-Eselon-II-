"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CircleCheck,
  Flag,
  LayoutGrid,
  LogOut,
  Send,
  Timer,
  CircleX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { QuizSkeleton } from "@/components/Skeletons";
import { Dialog, Sheet } from "@/components/ui/Overlay";
import { correctDisplayIndex, formatDuration, gradeSession, isCorrect, LETTERS } from "@/lib/quiz";
import { clearActive, loadActive, saveActive, saveResult } from "@/lib/storage";
import type { Session } from "@/lib/types";
import { useBank } from "@/lib/useBank";
import { Navigator } from "./Navigator";
import { OptionList } from "./OptionList";

const slide = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 40 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -40 }),
};

export function Quiz() {
  const router = useRouter();
  const { bank, error } = useBank();
  const [session, setSession] = useState<Session | null>(null);
  const [dir, setDir] = useState(1);
  const [navOpen, setNavOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const submitted = useRef(false);

  useEffect(() => {
    const s = loadActive();
    if (s) setSession(s);
    else router.replace("/");
  }, [router]);

  useEffect(() => {
    if (session && !submitted.current) saveActive(session);
  }, [session]);

  const byId = useMemo(() => (bank ? new Map(bank.mc.map((q) => [q.id, q])) : null), [bank]);
  const sectionTitle = useMemo(
    () => new Map(bank?.sections.map((s) => [s.id, s.title]) ?? []),
    [bank],
  );

  const finish = useCallback(() => {
    if (!bank || !session || submitted.current) return;
    submitted.current = true;
    const result = gradeSession(bank, session);
    saveResult(result);
    clearActive();
    router.replace(`/hasil/${result.id}`);
  }, [bank, session, router]);

  // Timer
  const deadline = session?.durationSec ? session.startedAt + session.durationSec * 1000 : null;
  useEffect(() => {
    if (!deadline) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [deadline]);
  const remaining = deadline ? Math.max(0, Math.round((deadline - now) / 1000)) : null;
  useEffect(() => {
    if (remaining === 0) finish();
  }, [remaining, finish]);

  const go = useCallback((i: number) => {
    setSession((s) => {
      if (!s || i < 0 || i >= s.items.length || i === s.current) return s;
      setDir(i > s.current ? 1 : -1);
      return { ...s, current: i };
    });
  }, []);

  const choose = useCallback((c: number) => {
    setSession((s) => {
      if (!s) return s;
      if (s.mode === "belajar" && s.answers[s.current] !== null) return s;
      const answers = [...s.answers];
      answers[s.current] = s.mode === "ujian" && answers[s.current] === c ? null : c;
      return { ...s, answers };
    });
  }, []);

  const toggleFlag = useCallback(() => {
    setSession((s) => {
      if (!s) return s;
      const flags = [...s.flags];
      flags[s.current] = !flags[s.current];
      return { ...s, flags };
    });
  }, []);

  // Pintasan keyboard: A–E / 1–5 pilih, ← → pindah, F ragu-ragu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!session || navOpen || confirmOpen || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const idx = "abcde".indexOf(k) >= 0 ? "abcde".indexOf(k) : "12345".indexOf(k);
      if (idx >= 0 && k.length === 1) choose(idx);
      else if (e.key === "ArrowRight") go(session.current + 1);
      else if (e.key === "ArrowLeft") go(session.current - 1);
      else if (k === "f") toggleFlag();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [session, navOpen, confirmOpen, choose, go, toggleFlag]);

  if (error)
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <p className="rounded-2xl bg-bad-soft p-5 text-bad">{error}</p>
      </div>
    );
  if (!bank || !session || !byId) return <QuizSkeleton />;

  const total = session.items.length;
  const cur = session.current;
  const item = session.items[cur];
  const q = byId.get(item.qid)!;
  const choice = session.answers[cur];
  const learn = session.mode === "belajar";
  const reveal = learn && choice !== null;
  const answered = session.answers.filter((a) => a !== null).length;
  const flagged = session.flags.filter(Boolean).length;
  const isLast = cur === total - 1;
  const lowTime = remaining !== null && remaining <= 60;

  const learnStats = learn
    ? session.items.reduce(
        (acc, it, i) => {
          const a = session.answers[i];
          if (a !== null) acc[isCorrect(byId.get(it.qid)!, it, a) ? 0 : 1]++;
          return acc;
        },
        [0, 0],
      )
    : null;

  return (
    <div className="min-h-dvh pb-28 lg:pb-10">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4">
          <button
            onClick={() => router.push("/")}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface transition hover:text-bad"
            aria-label="Keluar (progres tersimpan)"
            title="Keluar — progres tersimpan"
          >
            <LogOut className="size-4" />
          </button>

          <div className="min-w-0 flex-1">
            <p className="tabular text-sm font-extrabold">
              Soal {cur + 1}
              <span className="font-semibold text-muted"> / {total}</span>
            </p>
            <p className="tabular truncate text-xs text-muted">
              {learnStats ? (
                <>
                  <span className="text-ok">{learnStats[0]} benar</span> ·{" "}
                  <span className="text-bad">{learnStats[1]} salah</span>
                </>
              ) : (
                `${answered} terjawab · ${flagged} ragu`
              )}
            </p>
          </div>

          {remaining !== null && (
            <motion.div
              animate={lowTime ? { scale: [1, 1.06, 1] } : { scale: 1 }}
              transition={lowTime ? { repeat: Infinity, duration: 1 } : undefined}
              className={clsx(
                "tabular flex items-center gap-1.5 rounded-full px-3.5 py-2 font-mono text-sm font-bold",
                lowTime ? "bg-bad text-white" : "border border-line bg-surface",
              )}
            >
              <Timer className="size-4" />
              {formatDuration(remaining)}
            </motion.div>
          )}

          <button
            onClick={() => setNavOpen(true)}
            className="grid size-10 shrink-0 place-items-center rounded-xl border border-line bg-surface lg:hidden"
            aria-label="Daftar soal"
          >
            <LayoutGrid className="size-4" />
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="hidden items-center gap-2 rounded-xl bg-ink px-4 py-2.5 text-sm font-bold text-bg transition active:scale-95 lg:flex"
          >
            <Send className="size-4" /> Kumpulkan
          </button>
        </div>
        <div className="h-1 bg-line/60">
          <motion.div
            className="h-full bg-brand"
            initial={false}
            animate={{ width: `${(answered / total) * 100}%` }}
            transition={{ type: "spring", stiffness: 120, damping: 20 }}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_320px] lg:gap-8">
        {/* Soal */}
        <div className="min-w-0 overflow-x-clip">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.article
              key={cur}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.22, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.18}
              dragDirectionLock
              onDragEnd={(_, info) => {
                if (info.offset.x < -90) go(cur + 1);
                else if (info.offset.x > 90) go(cur - 1);
              }}
              className="touch-pan-y"
            >
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand">
                  Bagian {q.section}
                  <span className="hidden font-medium opacity-80 sm:inline">
                    · {sectionTitle.get(q.section)}
                  </span>
                </span>
                {session.flags[cur] && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                    <Flag className="size-3" /> Ragu-ragu
                  </span>
                )}
              </div>

              <h1 className="mb-6 text-pretty text-lg font-semibold leading-relaxed sm:text-xl">
                {q.question}
              </h1>

              <OptionList q={q} item={item} choice={choice} reveal={reveal} onChoose={choose} />

              <AnimatePresence>
                {reveal && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={clsx(
                      "mt-4 flex items-center gap-3 rounded-2xl p-4 text-sm font-semibold",
                      isCorrect(q, item, choice) ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad",
                    )}
                  >
                    {isCorrect(q, item, choice) ? (
                      <>
                        <CircleCheck className="size-5 shrink-0" /> Tepat! Lanjutkan ke soal berikutnya.
                      </>
                    ) : (
                      <>
                        <CircleX className="size-5 shrink-0" /> Kurang tepat. Jawaban benar:{" "}
                        {LETTERS[correctDisplayIndex(q, item)]}
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <p className="mt-6 hidden text-xs text-muted sm:block">
                Pintasan: <kbd className="font-mono">A–E</kbd> pilih · <kbd className="font-mono">← →</kbd>{" "}
                pindah · <kbd className="font-mono">F</kbd> ragu-ragu
              </p>
            </motion.article>
          </AnimatePresence>
        </div>

        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div className="sticky top-24 rounded-3xl border border-line bg-surface p-5">
            <h2 className="mb-3 text-sm font-extrabold">Daftar soal</h2>
            <div className="scrollbar-thin -mx-1 max-h-[calc(100dvh-16rem)] overflow-y-auto px-1 py-1">
              <Navigator session={session} byId={byId} onJump={go} />
            </div>
          </div>
        </aside>
      </main>

      {/* Bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 lg:pr-[352px]">
          <button
            onClick={() => go(cur - 1)}
            disabled={cur === 0}
            className="grid size-12 shrink-0 place-items-center rounded-2xl border border-line bg-surface transition active:scale-95 disabled:opacity-40"
            aria-label="Sebelumnya"
          >
            <ArrowLeft className="size-5" />
          </button>
          <button
            onClick={toggleFlag}
            aria-pressed={session.flags[cur]}
            className={clsx(
              "flex h-12 items-center gap-2 rounded-2xl border px-4 text-sm font-bold transition active:scale-95",
              session.flags[cur]
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-surface text-muted",
            )}
          >
            <Flag className="size-4" />
            <span className="hidden min-[380px]:inline">Ragu</span>
          </button>
          {isLast ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setConfirmOpen(true)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-ink text-sm font-extrabold text-bg"
            >
              <Send className="size-4" /> Kumpulkan
            </motion.button>
          ) : (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => go(cur + 1)}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl bg-brand text-sm font-extrabold text-brand-ink shadow-[0_10px_24px_-12px_var(--brand)]"
            >
              Berikutnya <ArrowRight className="size-4" />
            </motion.button>
          )}
        </div>
      </nav>

      <Sheet open={navOpen} onClose={() => setNavOpen(false)} title={`Daftar soal · ${answered}/${total}`}>
        <Navigator
          session={session}
          byId={byId}
          onJump={(i) => {
            go(i);
            setNavOpen(false);
          }}
        />
        <button
          onClick={() => {
            setNavOpen(false);
            setConfirmOpen(true);
          }}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-3.5 text-sm font-extrabold text-bg"
        >
          <Send className="size-4" /> Kumpulkan jawaban
        </button>
      </Sheet>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <div className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Send className="size-5" />
        </div>
        <h2 className="text-xl font-extrabold tracking-tight">Kumpulkan jawaban?</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Setelah dikumpulkan, jawaban tidak bisa diubah lagi.
        </p>
        <div className="tabular mt-5 grid grid-cols-3 gap-2 text-center">
          {[
            ["Terjawab", answered, "text-brand"],
            ["Kosong", total - answered, total - answered ? "text-bad" : "text-muted"],
            ["Ragu", flagged, flagged ? "text-accent" : "text-muted"],
          ].map(([k, v, c]) => (
            <div key={k as string} className="rounded-2xl bg-surface-2 py-3 ring-1 ring-line">
              <div className={clsx("text-2xl font-extrabold", c as string)}>{v}</div>
              <div className="text-xs text-muted">{k}</div>
            </div>
          ))}
        </div>
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => setConfirmOpen(false)}
            className="h-12 flex-1 rounded-2xl border border-line text-sm font-bold"
          >
            Periksa lagi
          </button>
          <button
            onClick={finish}
            className="h-12 flex-1 rounded-2xl bg-brand text-sm font-extrabold text-brand-ink"
          >
            Ya, kumpulkan
          </button>
        </div>
      </Dialog>
    </div>
  );
}
