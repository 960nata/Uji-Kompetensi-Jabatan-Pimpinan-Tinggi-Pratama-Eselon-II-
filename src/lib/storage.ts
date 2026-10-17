import type { Seen } from "./quiz";
import type { HistoryEntry, Result, Session } from "./types";

/**
 * Penyimpanan sederhana berbasis localStorage — tanpa database, tanpa login.
 * Semua akses dibungkus try/catch agar aman di mode private / storage diblokir.
 */
const KEY_ACTIVE = "ujian:active:v1";
const KEY_HISTORY = "ujian:history:v1";
const KEY_ESSAY = "ujian:essay:v1";
const KEY_SEEN = "ujian:seen:v1";
const resultKey = (id: string) => `ujian:result:${id}`;

const MAX_HISTORY = 30;
const MAX_FULL_RESULTS = 10;

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage penuh / diblokir — abaikan */
  }
}

function remove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {}
}

export const loadActive = () => read<Session>(KEY_ACTIVE);
export const saveActive = (s: Session) => write(KEY_ACTIVE, s);
export const clearActive = () => remove(KEY_ACTIVE);

export const loadHistory = () => read<HistoryEntry[]>(KEY_HISTORY) ?? [];

export function saveResult(r: Result) {
  write(resultKey(r.id), r);
  const entry: HistoryEntry = {
    id: r.id,
    mode: r.mode,
    finishedAt: r.finishedAt,
    elapsedSec: r.elapsedSec,
    total: r.total,
    correct: r.correct,
    score: r.score,
  };
  const history = [entry, ...loadHistory().filter((h) => h.id !== r.id)];
  // Hasil lengkap (untuk pembahasan) hanya disimpan untuk N terakhir.
  history.slice(MAX_FULL_RESULTS).forEach((h) => remove(resultKey(h.id)));
  write(KEY_HISTORY, history.slice(0, MAX_HISTORY));
}

export const loadResult = (id: string) => read<Result>(resultKey(id));

/** Update hasil tanpa mengubah urutan riwayat (mis. nilai mandiri essay). */
export const updateResult = (r: Result) => write(resultKey(r.id), r);

/** Soal yang sudah pernah keluar, agar sesi berikutnya mendapat soal berbeda. */
export const loadSeen = (): Seen => read<Seen>(KEY_SEEN) ?? { mc: [], essay: [] };
export const saveSeen = (s: Seen) => write(KEY_SEEN, s);

export function clearHistory() {
  loadHistory().forEach((h) => remove(resultKey(h.id)));
  remove(KEY_HISTORY);
}

export type EssayDrafts = Record<number, string>;
export const loadEssayDrafts = () => read<EssayDrafts>(KEY_ESSAY) ?? {};
export const saveEssayDrafts = (d: EssayDrafts) => write(KEY_ESSAY, d);
