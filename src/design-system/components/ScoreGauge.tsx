"use client";

import { motion, useReducedMotion } from "motion/react";
import { copy } from "@/content/copy";
import { scoreBand } from "@/lib/scoring";
import { cn } from "@/lib/utils";

const bandColor = { pass: "var(--status-pass)", watch: "var(--status-watch)", fix: "var(--status-fix)" };
const bandInk = { pass: "text-pass-ink", watch: "text-watch-ink", fix: "text-fix-ink" };

/** Big friendly readiness gauge. A score is never shown without a word beside it. */
export function ScoreGauge({
  score,
  size = 220,
  className,
  animate = true,
}: {
  score: number;
  size?: number;
  className?: string;
  animate?: boolean;
}) {
  const reduce = useReducedMotion();
  const band = scoreBand(score);
  const r = 80;
  const sweep = 240; // degrees of arc
  const circumference = 2 * Math.PI * r;
  const arc = (sweep / 360) * circumference;
  const filled = (Math.max(0, Math.min(100, score)) / 100) * arc;
  const still = reduce || !animate;

  return (
    <div
      className={cn("relative inline-flex flex-col items-center", className)}
      style={{ width: size }}
      role="img"
      aria-label={copy.gauge.aria(score, copy.scoreWords[band])}
    >
      <svg viewBox="0 0 200 170" className="w-full" aria-hidden>
        <g transform="rotate(150 100 100)">
          <circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke="var(--line)"
            strokeWidth="16"
            strokeLinecap="round"
            strokeDasharray={`${arc} ${circumference}`}
          />
          <motion.circle
            cx="100"
            cy="100"
            r={r}
            fill="none"
            stroke={bandColor[band]}
            strokeWidth="16"
            strokeLinecap="round"
            initial={still ? false : { strokeDasharray: `0.01 ${circumference}` }}
            animate={{ strokeDasharray: `${Math.max(filled, 0.01)} ${circumference}` }}
            transition={still ? { duration: 0 } : { type: "spring", stiffness: 40, damping: 12, delay: 0.15 }}
          />
        </g>
      </svg>
      <div className="absolute inset-x-0 top-[34%] flex flex-col items-center">
        <span className="tabular font-mono text-5xl leading-none font-bold" data-testid="score-value">
          {score}
        </span>
        <span className="mt-1 font-mono text-xs text-ink-muted">{copy.gauge.outOf}</span>
      </div>
      <span className={cn("-mt-4 text-sm font-semibold", bandInk[band])}>{copy.scoreWords[band]}</span>
    </div>
  );
}
