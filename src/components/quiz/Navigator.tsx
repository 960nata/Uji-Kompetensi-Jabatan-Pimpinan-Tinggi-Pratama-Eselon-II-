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
      ]
    : [
        ["bg-ink", "Terjawab"],
        ["bg-accent", "Ragu"],
      ];
  if (session.essayIds?.length) legend.push(["border border-dashed border-muted", "Essay"]);

  return (
    <div>
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10 lg:grid-cols-6">
        {session.items.map((item, i) => {
          const a = session.answers[i];
          const flag = session.flags[i];
          let cls = "border border-line text-muted hover:border-muted";
          if (a !== null) {
            if (learn) cls = isCorrect(byId.get(item.qid)!, item, a) ? "bg-ok text-bg" : "bg-bad text-bg";
            else cls = "bg-ink text-bg";
          }
          if (flag && !(learn && a !== null)) cls = "bg-accent text-bg";
          return (
            <button
              key={i}
              onClick={() => onJump(i)}
              aria-label={`Soal ${i + 1}`}
              aria-current={session.current === i}
              className={clsx(
                "tabular aspect-square rounded-md text-xs transition",
                cls,
                session.current === i && "ring-2 ring-ink ring-offset-2 ring-offset-bg",
              )}
            >
              {i + 1}
            </button>
          );
        })}
        {(session.essayIds ?? []).map((id, k) => {
          const i = session.items.length + k;
          const written = !!session.essayAnswers?.[k]?.trim();
          return (
            <button
              key={`e${id}`}
              onClick={() => onJump(i)}
              aria-label={`Essay ${k + 1}`}
              aria-current={session.current === i}
              className={clsx(
                "tabular aspect-square rounded-md text-xs italic transition",
                session.flags[i]
                  ? "bg-accent text-bg"
                  : written
                    ? "bg-ink text-bg"
                    : "border border-dashed border-line text-muted hover:border-muted",
                session.current === i && "ring-2 ring-ink ring-offset-2 ring-offset-bg",
              )}
            >
              {i + 1}
            </button>
          );
        })}
      </div>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        {legend.map(([c, l]) => (
          <span key={l} className="inline-flex items-center gap-1.5">
            <span className={clsx("size-2 rounded-full", c)} /> {l}
          </span>
        ))}
      </div>
    </div>
  );
}
