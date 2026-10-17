"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";

export function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => v.toFixed(1));

  useEffect(() => {
    const ctl = animate(mv, score, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return () => ctl.stop();
  }, [mv, score]);

  return (
    <div className="relative size-44 shrink-0">
      <svg viewBox="0 0 160 160" className="size-full -rotate-90">
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--line)" strokeWidth="12" />
        <motion.circle
          cx="80"
          cy="80"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - score / 100) }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        <div>
          <motion.div className="tabular text-4xl font-extrabold tracking-tight">{text}</motion.div>
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">Nilai</div>
        </div>
      </div>
    </div>
  );
}
