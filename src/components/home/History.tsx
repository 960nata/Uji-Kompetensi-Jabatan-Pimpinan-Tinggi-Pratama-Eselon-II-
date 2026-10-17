"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/quiz";
import { clearHistory, loadHistory, loadResult } from "@/lib/storage";
import type { HistoryEntry } from "@/lib/types";

export function History() {
  const [items, setItems] = useState<HistoryEntry[] | null>(null);
  useEffect(() => setItems(loadHistory()), []);

  if (!items || items.length === 0) return null;

  return (
    <section className="mt-14">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-xs font-medium uppercase tracking-wider text-muted">Riwayat</h2>
        <button
          onClick={() => {
            if (confirm("Hapus semua riwayat nilai di perangkat ini?")) {
              clearHistory();
              setItems([]);
            }
          }}
          className="text-xs text-muted hover:text-bad"
        >
          Hapus
        </button>
      </div>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((h, i) => {
          const row = (
            <>
              <span className="tabular w-12 text-base font-semibold">{h.score.toFixed(0)}</span>
              <span className="flex-1 text-sm">
                {h.correct}/{h.total} benar
                <span className="text-muted"> · {h.mode === "ujian" ? "Ujian" : "Belajar"}</span>
              </span>
              <span className="tabular text-right text-xs text-muted">
                {new Date(h.finishedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} ·{" "}
                {formatDuration(h.elapsedSec)}
              </span>
            </>
          );
          return (
            <li key={h.id}>
              {i < 10 && loadResult(h.id) ? (
                <Link href={`/hasil/${h.id}`} className="flex items-center gap-3 py-3 transition hover:opacity-70">
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-3 py-3">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
