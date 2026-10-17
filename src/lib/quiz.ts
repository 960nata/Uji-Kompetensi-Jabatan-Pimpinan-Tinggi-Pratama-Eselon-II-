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

export const SECONDS_PER_ESSAY = 5 * 60;
export const ESSAY_RATIO = 0.2;

export type SessionConfig = {
  mode: Mode;
  /** 0 = semua soal pada bagian terpilih. */
  count: number;
  sections: string[];
  timed: boolean;
  withEssay: boolean;
};

export type Seen = { mc: number[]; essay: number[] };

/** Pembagian jumlah soal: 80% PG + 20% essay bila essay diikutkan. */
export function splitCount(bank: Bank, cfg: Pick<SessionConfig, "count" | "sections" | "withEssay">) {
  const mcPool = bank.mc.filter((q) => cfg.sections.includes(q.section)).length;
  if (cfg.count === 0) return { mc: mcPool, essay: cfg.withEssay ? bank.essay.length : 0 };
  const essay = cfg.withEssay ? Math.min(bank.essay.length, Math.max(1, Math.round(cfg.count * ESSAY_RATIO))) : 0;
  return { mc: Math.min(cfg.count - essay, mcPool), essay };
}

/**
 * Ambil n soal acak, mendahulukan soal yang belum pernah keluar.
 * Bila stok soal baru habis, putaran direset sehingga soal lama baru muncul lagi
 * setelah seluruh bank terpakai.
 */
function pickFresh(pool: number[], seen: number[], n: number) {
  const seenSet = new Set(seen);
  const fresh = shuffle(pool.filter((id) => !seenSet.has(id)));
  if (fresh.length >= n) {
    const picked = fresh.slice(0, n);
    return { picked, seen: [...seen, ...picked] };
  }
  const refill = shuffle(pool.filter((id) => seenSet.has(id))).slice(0, n - fresh.length);
  const picked = shuffle([...fresh, ...refill]);
  // Putaran baru dimulai: hanya soal sesi ini yang dihitung sudah keluar.
  return { picked, seen: picked };
}

export function createSession(bank: Bank, cfg: SessionConfig, seen: Seen = { mc: [], essay: [] }) {
  const n = splitCount(bank, cfg);
  const mcPool = bank.mc.filter((q) => cfg.sections.includes(q.section)).map((q) => q.id);
  const mcPick = pickFresh(mcPool, seen.mc.filter((id) => mcPool.includes(id)), n.mc);
  const essayPick = pickFresh(bank.essay.map((e) => e.id), seen.essay, n.essay);
  const byId = new Map(bank.mc.map((q) => [q.id, q]));

  const items: SessionItem[] = mcPick.picked.map((id) => ({
    qid: id,
    order: shuffle(byId.get(id)!.options.map((_, i) => i)),
  }));
  const essayIds = essayPick.picked;

  const session: Session = {
    id: makeId(),
    mode: cfg.mode,
    sections: cfg.sections,
    items,
    answers: items.map(() => null),
    essayIds,
    essayAnswers: essayIds.map(() => ""),
    flags: [...items, ...essayIds].map(() => false),
    current: 0,
    startedAt: Date.now(),
    durationSec: cfg.timed
      ? items.length * SECONDS_PER_QUESTION + essayIds.length * SECONDS_PER_ESSAY
      : null,
  };
  // Soal PG di luar bagian terpilih tetap tercatat sebagai sudah keluar.
  const otherSeen = seen.mc.filter((id) => !mcPool.includes(id));
  return { session, seen: { mc: [...otherSeen, ...mcPick.seen], essay: essayPick.seen } };
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
    essayIds: s.essayIds ?? [],
    essayAnswers: s.essayAnswers ?? [],
    essayScores: (s.essayIds ?? []).map(() => null),
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
