import type { Bank, MCQuestion, Mode, Result, Session, SessionItem } from "./types";

export const LETTERS = ["A", "B", "C", "D", "E"] as const;
export const SECONDS_PER_QUESTION = 60;

function randomInt(max: number) {
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/** Fisher–Yates, mengembalikan salinan baru. */
export function shuffle<T>(input: readonly T[]): T[] {
  const arr = [...input];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function makeId() {
  return `${Date.now().toString(36)}${randomInt(1e9).toString(36)}`;
}

export type SessionConfig = {
  mode: Mode;
  count: number;
  sections: string[];
  timed: boolean;
};

export function createSession(bank: Bank, cfg: SessionConfig): Session {
  const pool = bank.mc.filter((q) => cfg.sections.includes(q.section));
  const picked = shuffle(pool).slice(0, Math.min(cfg.count, pool.length));
  const items: SessionItem[] = picked.map((q) => ({
    qid: q.id,
    order: shuffle(q.options.map((_, i) => i)),
  }));
  return {
    id: makeId(),
    mode: cfg.mode,
    sections: cfg.sections,
    items,
    answers: items.map(() => null),
    flags: items.map(() => false),
    current: 0,
    startedAt: Date.now(),
    durationSec: cfg.timed ? items.length * SECONDS_PER_QUESTION : null,
  };
}

/** Posisi tampil dari opsi yang benar setelah diacak. */
export function correctDisplayIndex(q: MCQuestion, item: SessionItem) {
  return item.order.indexOf(q.answer);
}

export function isCorrect(q: MCQuestion, item: SessionItem, choice: number | null) {
  return choice !== null && item.order[choice] === q.answer;
}

export function gradeSession(bank: Bank, s: Session): Result {
  const byId = new Map(bank.mc.map((q) => [q.id, q]));
  let correct = 0;
  let blank = 0;
  const perSection = new Map<string, { correct: number; total: number }>();

  s.items.forEach((item, i) => {
    const q = byId.get(item.qid)!;
    const sec = perSection.get(q.section) ?? { correct: 0, total: 0 };
    sec.total++;
    const choice = s.answers[i];
    if (choice === null) blank++;
    else if (isCorrect(q, item, choice)) {
      correct++;
      sec.correct++;
    }
    perSection.set(q.section, sec);
  });

  const finishedAt = Date.now();
  const total = s.items.length;
  return {
    id: s.id,
    mode: s.mode,
    startedAt: s.startedAt,
    finishedAt,
    elapsedSec: Math.round((finishedAt - s.startedAt) / 1000),
    durationSec: s.durationSec,
    items: s.items,
    answers: s.answers,
    total,
    correct,
    wrong: total - correct - blank,
    blank,
    score: total ? Math.round((correct / total) * 1000) / 10 : 0,
    perSection: bank.sections
      .filter((sec) => perSection.has(sec.id))
      .map((sec) => ({ id: sec.id, ...perSection.get(sec.id)! })),
  };
}

export function formatDuration(totalSec: number) {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => n.toString().padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${pad(m)}:${pad(sec)}`;
}

export function gradeLabel(score: number) {
  if (score >= 85) return { label: "Sangat Baik", tone: "ok" as const };
  if (score >= 70) return { label: "Baik", tone: "brand" as const };
  if (score >= 55) return { label: "Cukup", tone: "accent" as const };
  return { label: "Perlu Latihan", tone: "bad" as const };
}
