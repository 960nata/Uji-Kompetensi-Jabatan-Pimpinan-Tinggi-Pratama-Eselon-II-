"use client";

import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, History as HistoryIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDuration, gradeLabel } from "@/lib/quiz";
import { clearHistory, loadHistory, loadResult } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

const toneClass = {
  ok: "bg-ok-soft text-ok",
  brand: "bg-brand-soft text-brand",
  accent: "bg-accent-soft text-accent",
  bad: "bg-bad-soft text-bad",
};

export function History() {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  useEffect(() => setItems(loadHistory()), []);

  if (!items || items.length === 0) return null;

  const best = Math.max(...items.map((i) => i.score));
  const avg = items.reduce((a, i) => a + i.score, 0) / items.length;

  return (
    <div className="rounded-[28px] border border-line bg-surface p-5 sm:p-7">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
          <HistoryIcon className="size-5 text-brand" /> Riwayat nilai
        </h2>
        <button
          onClick={() => {
            if (confirm("Hapus semua riwayat nilai di perangkat ini?")) {
              clearHistory();
              setItems([]);
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-semibold text-muted transition hover:bg-bad-soft hover:text-bad"
        >
          <Trash2 className="size-3.5" /> Hapus
        </button>
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2 text-center">
        {[
          ["Sesi", items.length.toString()],
          ["Terbaik", best.toFixed(1)],
          ["Rata-rata", avg.toFixed(1)],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-surface-2 py-2.5 ring-1 ring-line">
            <div className="tabular text-lg font-extrabold">{v}</div>
            <div className="text-[11px] font-medium uppercase tracking-wider text-muted">{k}</div>
          </div>
        ))}
      </div>

      <ul className="scrollbar-thin -mx-1 max-h-[360px] space-y-1 overflow-y-auto px-1">
        <AnimatePresence initial={false}>
          {items.map((h, i) => {
            const g = gradeLabel(h.score);
            const hasDetail = i < 10 && loadResult(h.id) !== null;
            const row = (
              <>
                <span
                  className={clsx(
                    "tabular grid h-11 w-14 shrink-0 place-items-center rounded-xl text-sm font-extrabold",
                    toneClass[g.tone],
                  )}
                >
                  {h.score.toFixed(0)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold">
                    {h.correct}/{h.total} benar
                    <span className="ml-2 text-xs font-medium text-muted">
                      {h.mode === "ujian" ? "Ujian" : "Belajar"}
                    </span>
                  </span>
                  <span className="tabular block truncate text-xs text-muted">
                    {new Date(h.finishedAt).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}{" "}
                    · {formatDuration(h.elapsedSec)}
                  </span>
                </span>
                {hasDetail && <ChevronRight className="size-4 text-muted" />}
              </>
            );
            return (
              <motion.li
                key={h.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 8) * 0.03 }}
              >
                {hasDetail ? (
                  <Link
                    href={`/hasil/${h.id}`}
                    className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-surface-2"
                  >
                    {row}
                  </Link>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl p-2">{row}</div>
                )}
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
    </div>
  );
}
