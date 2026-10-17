export type Section = { id: string; title: string };

export type MCQuestion = {
  id: number;
  section: string;
  question: string;
  options: string[];
  /** Indeks opsi benar pada urutan asli (0 = A). */
  answer: number;
};

export type EssayQuestion = {
  id: number;
  question: string;
  keyPoints: string;
};

export type Bank = {
  sections: Section[];
  mc: MCQuestion[];
  essay: EssayQuestion[];
};

export type Mode = "ujian" | "belajar";

export type SessionItem = {
  qid: number;
  /** order[posisiTampil] = indeks opsi asli. Kunci jawaban ikut teracak lewat pemetaan ini. */
  order: number[];
};

export type Session = {
  id: string;
  mode: Mode;
  sections: string[];
  items: SessionItem[];
  answers: (number | null)[];
  flags: boolean[];
  current: number;
  startedAt: number;
  durationSec: number | null;
};

export type SectionScore = { id: string; correct: number; total: number };

export type Result = {
  id: string;
  mode: Mode;
  startedAt: number;
  finishedAt: number;
  elapsedSec: number;
  durationSec: number | null;
  items: SessionItem[];
  answers: (number | null)[];
  total: number;
  correct: number;
  wrong: number;
  blank: number;
  score: number;
  perSection: SectionScore[];
};

export type HistoryEntry = Pick<
  Result,
  "id" | "mode" | "finishedAt" | "elapsedSec" | "total" | "correct" | "score"
>;
