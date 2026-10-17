"use client";

import clsx from "clsx";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
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
    <div className="space-y-2.5" role="radiogroup">
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: dim ? 0.55 : 1, y: 0 }}
            transition={{ delay: 0.04 * i, duration: 0.3 }}
            whileTap={onChoose ? { scale: 0.985 } : undefined}
            className={clsx(
              "group flex w-full items-start gap-3.5 rounded-2xl border p-3.5 text-left transition-colors sm:p-4",
              isKey
                ? "border-ok bg-ok-soft"
                : isWrong
                  ? "border-bad bg-bad-soft"
                  : selected
                    ? "border-brand bg-brand-soft shadow-[0_8px_24px_-14px_var(--brand)]"
                    : "border-line bg-surface",
              onChoose && !selected && !reveal && "hover:border-brand/50",
            )}
          >
            <span
              className={clsx(
                "grid size-9 shrink-0 place-items-center rounded-xl text-sm font-extrabold transition-colors",
                isKey
                  ? "bg-ok text-white"
                  : isWrong
                    ? "bg-bad text-white"
                    : selected
                      ? "bg-brand text-brand-ink"
                      : "bg-surface-2 text-muted ring-1 ring-line group-hover:text-brand",
              )}
            >
              {isKey ? <Check className="size-4" strokeWidth={3} /> : isWrong ? <X className="size-4" strokeWidth={3} /> : LETTERS[i]}
            </span>
            <span className="pt-1.5 text-[15px] leading-relaxed sm:text-base">{q.options[orig]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
