"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { EvidenceCard, LogoMark, statusIcons } from "@/design-system/components";
import { copy } from "@/content/copy";
import type { ControlStatus, EvidenceType } from "@/mocks/types";

const t = copy.generation;
const DURATION_MS = 6000;

const flyers: { type: EvidenceType; from: { x: number; y: number }; summary: string }[] = [
  { type: "lineage", from: { x: -460, y: 60 }, summary: "38 of 41 risk tables traced" },
  { type: "access_grant", from: { x: 460, y: 20 }, summary: "1,946 grants checked" },
  { type: "change_record", from: { x: -420, y: 260 }, summary: "312 changes reviewed" },
  { type: "dq_check", from: { x: 440, y: 240 }, summary: "128 quality checks read" },
  { type: "retention_policy", from: { x: -380, y: 420 }, summary: "183 retention rules found" },
  { type: "ownership_tag", from: { x: 400, y: 430 }, summary: "14 catalogs tagged" },
];

const lineColor = { pass: "text-pass-ink", watch: "text-watch-ink", fix: "text-fix-ink" };

/**
 * Full-screen "printing" moment while a report is generated (about 6 seconds):
 * evidence cards fly into the printer and the receipt prints line by line.
 * With reduced motion it becomes a calm progress list.
 */
export function GenerationOverlay({ lines }: { lines: { title: string; status: ControlStatus }[] }) {
  const reduce = useReducedMotion();
  const shown = lines.slice(0, 8);
  const [printed, setPrinted] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const lineTimer = setInterval(() => setPrinted((n) => Math.min(n + 1, shown.length)), (DURATION_MS - 900) / Math.max(shown.length, 1));
    const stageTimer = setInterval(() => setStage((s) => Math.min(s + 1, t.stages.length - 1)), DURATION_MS / t.stages.length);
    return () => {
      clearInterval(lineTimer);
      clearInterval(stageTimer);
    };
  }, [shown.length]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={t.title}
      data-testid="generation-overlay"
      className="no-print fixed inset-0 z-[90] flex flex-col items-center overflow-hidden bg-paper px-6 pt-[8vh]"
    >
      <h2 className="text-3xl font-extrabold">{t.title}</h2>
      <p className="mt-2 text-ink-muted">{t.subtitle}</p>
      <p className="mt-3 font-mono text-sm text-brand">{t.stages[stage]}…</p>

      <div className="relative mt-8 w-full max-w-sm">
        {/* evidence flying into the printer */}
        {reduce
          ? null
          : flyers.map((f, i) => (
              <motion.div
                key={f.type}
                aria-hidden
                className="absolute top-0 left-1/2 z-10 w-56"
                initial={{ x: f.from.x - 112, y: f.from.y, opacity: 0, scale: 1, rotate: i % 2 ? 6 : -6 }}
                animate={{
                  x: [f.from.x - 112, f.from.x - 112, -112],
                  y: [f.from.y, f.from.y, -10],
                  opacity: [0, 1, 0],
                  scale: [0.9, 1, 0.25],
                }}
                transition={{ duration: 1.5, delay: 0.3 + i * 0.85, times: [0, 0.25, 1], ease: "easeInOut" }}
              >
                <EvidenceCard
                  compact
                  evidence={{ type: f.type, source: "system.*", summary: f.summary, capturedAt: "2026-11-10T06:12:00Z" }}
                />
              </motion.div>
            ))}

        {/* the printer slot */}
        <div className="relative z-20 flex h-12 items-center justify-between rounded-2xl bg-ink px-4 text-paper shadow-pop">
          <span className="flex items-center gap-2 font-heading font-bold">
            <LogoMark size={22} /> {copy.brand.name}
          </span>
          <span className="flex gap-1.5" aria-hidden>
            <span className="size-2 animate-pulse rounded-full bg-mint" />
            <span className="size-2 rounded-full bg-sun" />
          </span>
        </div>

        {/* the receipt, printing line by line */}
        <div className="paper-shadow relative z-0 mx-4 -mt-2">
          <div className="zigzag-bottom bg-surface px-5 pt-5">
            <p className="text-center font-mono text-xs tracking-[0.2em] text-ink-muted uppercase">{t.receiptTitle}</p>
            <ul className="dashed-rule mt-3 space-y-2 pt-3 font-mono text-xs">
              {shown.slice(0, printed).map((line) => {
                const Icon = statusIcons[line.status];
                return (
                  <motion.li
                    key={line.title}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="min-w-0 truncate">{line.title}</span>
                    <Icon className={`size-4 shrink-0 ${lineColor[line.status]}`} aria-hidden />
                  </motion.li>
                );
              })}
            </ul>
            <div className="dashed-rule mt-3 pt-3">
              <div className="h-2 overflow-hidden rounded-full bg-line">
                <div className="h-full origin-left rounded-full bg-brand" style={{ animation: `receipt-progress ${DURATION_MS}ms linear forwards` }} />
              </div>
            </div>
          </div>
        </div>
      </div>
      <style>{`@keyframes receipt-progress{from{width:2%}to{width:100%}}`}</style>
    </div>
  );
}
