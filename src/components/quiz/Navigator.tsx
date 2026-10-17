"use client";

import clsx from "clsx";
import { isCorrect } from "@/lib/quiz";
import type { MCQuestion, Session } from "@/lib/types";

type Props = {
  session: Session;
  byId: Map<number, MCQuestion>;
  onJump: (i: number) => void;
};

export function Navigator({ session, byId, onJump }: Props) {
  const learn = session.mode === "belajar";
  const legend = learn
    ? [
        ["bg-ok", "Benar"],
        ["bg-bad", "Salah"],
        ["bg-accent", "Ragu"],
        ["bg-surface-2 ring-1 ring-line", "Kosong"],
      ]
    : [
        ["bg-brand", "Terjawab"],
        ["bg-accent", "Ragu-ragu"],
        ["bg-surface-2 ring-1 ring-line", "Kosong"],
      ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
        {legend.map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className={clsx("size-3 rounded", c)} /> {l}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-8 lg:grid-cols-6">
        {session.items.map((item, i) => {
          const a = session.answers[i];
          const flag = session.flags[i];
          const current = session.current === i;
          let cls = "bg-surface-2 text-muted ring-1 ring-line hover:ring-brand/50";
          if (a !== null) {
            if (learn) {
              cls = isCorrect(byId.get(item.qid)!, item, a)
                ? "bg-ok text-white"
                : "bg-bad text-white";
            } else cls = "bg-brand text-brand-ink";
          }
          if (flag && !(learn && a !== null)) cls = "bg-accent text-white";
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              aria-label={`Soal ${i + 1}`}
              aria-current={current}
              className={clsx(
                "tabular relative aspect-square rounded-lg text-xs font-bold transition active:scale-90",
                cls,
                current && "ring-2 ring-ink ring-offset-2 ring-offset-surface",
              )}
            >
              {i + 1}
              {flag && learn && a !== null && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent ring-2 ring-surface" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
