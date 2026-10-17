"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { correctDisplayIndex, LETTERS } from "@/lib/quiz";
import type { MCQuestion, SessionItem } from "@/lib/types";

type Props = {
  q: MCQuestion;
  item: SessionItem;
  choice: number | null;
  /** Tampilkan kunci (mode belajar setelah menjawab / halaman pembahasan). */
  reveal: boolean;
  onChoose?: (i: number) => void;
};

export function OptionList({ q, item, choice, reveal, onChoose }: Props) {
  const correct = correctDisplayIndex(q, item);
  return (
    <div className="space-y-2" role="radiogroup">
      {item.order.map((orig, i) => {
        const selected = choice === i;
        const isKey = reveal && i === correct;
        const isWrong = reveal && selected && i !== correct;
        const dim = reveal && !isKey && !isWrong;
        return (
          <motion.button
            key={orig}
            role="radio"
            aria-checked={selected}
            disabled={!onChoose}
            onClick={() => onChoose?.(i)}
            initial={{ opacity: 0 }}
            animate={{ opacity: dim ? 0.45 : 1 }}
            transition={{ delay: 0.03 * i, duration: 0.2 }}
            className={clsx(
              "flex w-full items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
              isKey
                ? "border-ok bg-ok-soft"
                : isWrong
                  ? "border-bad bg-bad-soft"
                  : selected
                    ? "border-ink bg-surface-2"
                    : "border-line",
              onChoose && !selected && !reveal && "hover:border-muted",
            )}
          >
            <span
              className={clsx(
                "w-4 shrink-0 pt-px font-mono text-sm",
                isKey ? "text-ok" : isWrong ? "text-bad" : selected ? "font-semibold text-ink" : "text-muted",
              )}
            >
              {LETTERS[i]}
            </span>
            <span className="text-[15px] leading-relaxed">{q.options[orig]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
