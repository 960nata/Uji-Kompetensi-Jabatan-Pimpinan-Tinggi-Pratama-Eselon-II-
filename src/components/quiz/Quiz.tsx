"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Flag, X } from "lucide-react";
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
  enter: (dir: number) => ({ opacity: 0, x: dir * 16 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: dir * -16 }),
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
      <div className="grid min-h-dvh place-items-center p-6 text-center text-sm text-bad">{error}</div>
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

  return (
    <div className="min-h-dvh pb-24 lg:pb-10">
      <header className="sticky top-0 z-30 border-b border-line bg-bg/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-4 px-4">
          <button
            onClick={() => router.push("/")}
            className="-ml-1 grid size-8 place-items-center rounded-md text-muted transition hover:text-ink"
            aria-label="Keluar (progres tersimpan)"
            title="Keluar — progres tersimpan"
          >
            <X className="size-4" />
          </button>

          <button
            onClick={() => setNavOpen(true)}
            aria-label="Daftar soal"
            className="tabular flex-1 text-left text-sm lg:pointer-events-none"
          >
            <span className="font-medium">{cur + 1}</span>
            <span className="text-muted"> / {total}</span>
          </button>

          {remaining !== null && (
            <span className={clsx("tabular font-mono text-sm", lowTime ? "text-bad" : "text-muted")}>
              {formatDuration(remaining)}
            </span>
          )}

          <button
            onClick={() => setConfirmOpen(true)}
            className="hidden rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-bg transition hover:opacity-90 lg:block"
          >
            Kumpulkan
          </button>
        </div>
        <div className="h-px bg-line">
          <motion.div
            className="h-px bg-ink"
            initial={false}
            animate={{ width: `${(answered / total) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-4 py-8 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0 max-w-2xl overflow-x-clip">
          <AnimatePresence mode="wait" custom={dir} initial={false}>
            <motion.article
              key={cur}
              custom={dir}
              variants={slide}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.15, ease: "easeOut" }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.12}
              dragDirectionLock
              onDragEnd={(_, info) => {
                if (info.offset.x < -80) go(cur + 1);
                else if (info.offset.x > 80) go(cur - 1);
              }}
              className="touch-pan-y"
            >
              <p className="mb-3 text-xs text-muted">
                Bagian {q.section}
                <span className="hidden sm:inline"> · {sectionTitle.get(q.section)}</span>
                {session.flags[cur] && <span className="text-accent"> · Ragu-ragu</span>}
              </p>

              <h1 className="mb-6 text-pretty text-lg font-medium leading-relaxed">{q.question}</h1>

              <OptionList q={q} item={item} choice={choice} reveal={reveal} onChoose={choose} />

              {reveal && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className={clsx("mt-4 text-sm", isCorrect(q, item, choice) ? "text-ok" : "text-bad")}
                >
                  {isCorrect(q, item, choice)
                    ? "Benar."
                    : `Salah. Jawaban yang benar: ${LETTERS[correctDisplayIndex(q, item)]}.`}
                </motion.p>
              )}

              <p className="mt-8 hidden text-xs text-muted lg:block">
                Pintasan: A–E pilih · ← → pindah · F ragu-ragu
              </p>
            </motion.article>
          </AnimatePresence>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-22">
            <div className="mb-3 flex items-baseline justify-between text-xs text-muted">
              <span className="uppercase tracking-wider">Soal</span>
              <span className="tabular">
                {answered} terjawab · {flagged} ragu
              </span>
            </div>
            <div className="scrollbar-thin max-h-[calc(100dvh-12rem)] overflow-y-auto p-1">
              <Navigator session={session} byId={byId} onJump={go} />
            </div>
          </div>
        </aside>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-bg pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3">
          <button
            onClick={() => go(cur - 1)}
            disabled={cur === 0}
            className="grid size-11 shrink-0 place-items-center rounded-lg border border-line disabled:opacity-30"
            aria-label="Sebelumnya"
          >
            <ArrowLeft className="size-4" />
          </button>
          <button
            onClick={toggleFlag}
            aria-pressed={session.flags[cur]}
            aria-label="Tandai ragu-ragu"
            className={clsx(
              "grid size-11 shrink-0 place-items-center rounded-lg border",
              session.flags[cur] ? "border-accent text-accent" : "border-line text-muted",
            )}
          >
            <Flag className="size-4" />
          </button>
          <button
            onClick={() => (isLast ? setConfirmOpen(true) : go(cur + 1))}
            className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-ink text-sm font-medium text-bg active:opacity-90"
          >
            {isLast ? "Kumpulkan" : "Berikutnya"}
            {!isLast && <ArrowRight className="size-4" />}
          </button>
        </div>
      </nav>

      {/* Navigasi desktop di bawah soal */}
      <div className="mx-auto hidden max-w-5xl px-4 lg:block">
        <div className="flex max-w-2xl items-center gap-2">
          <button
            onClick={() => go(cur - 1)}
            disabled={cur === 0}
            className="rounded-md border border-line px-3 py-1.5 text-sm disabled:opacity-30"
          >
            ← Sebelumnya
          </button>
          <button
            onClick={toggleFlag}
            className={clsx(
              "rounded-md border px-3 py-1.5 text-sm",
              session.flags[cur] ? "border-accent text-accent" : "border-line text-muted",
            )}
          >
            Ragu-ragu
          </button>
          <button
            onClick={() => (isLast ? setConfirmOpen(true) : go(cur + 1))}
            className="ml-auto rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-bg"
          >
            {isLast ? "Kumpulkan" : "Berikutnya →"}
          </button>
        </div>
      </div>

      <Sheet open={navOpen} onClose={() => setNavOpen(false)} title={`${answered} dari ${total} terjawab`}>
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
          className="mt-6 w-full rounded-lg bg-ink py-3 text-sm font-medium text-bg"
        >
          Kumpulkan jawaban
        </button>
      </Sheet>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <h2 className="text-base font-semibold">Kumpulkan jawaban?</h2>
        <p className="tabular mt-2 text-sm leading-relaxed text-muted">
          {answered} terjawab, {total - answered} kosong
          {flagged > 0 && `, ${flagged} ragu-ragu`}. Jawaban tidak bisa diubah setelah dikumpulkan.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={() => setConfirmOpen(false)}
            className="rounded-md border border-line px-3.5 py-2 text-sm"
          >
            Batal
          </button>
          <button onClick={finish} className="rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-bg">
            Kumpulkan
          </button>
        </div>
      </Dialog>
    </div>
  );
}
