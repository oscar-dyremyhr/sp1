"use client";

import { motion, useReducedMotion } from "motion/react";
import { EvidenceCard, LogoMark, Stamp, statusIcons } from "@/design-system/components";
import { copy } from "@/content/copy";

const t = copy.marketing.hero;
const lineColor = { pass: "text-pass-ink", watch: "text-watch-ink", fix: "text-fix-ink" };

// Where each evidence card rests around the report, and where it flies in from.
const spots = [
  { className: "left-0 top-2 w-52 -rotate-6", from: { x: -140, y: -60 } },
  { className: "right-0 top-44 w-52 rotate-3", from: { x: 160, y: -40 } },
  { className: "left-2 bottom-2 w-52 rotate-2", from: { x: -120, y: 100 } },
];

/** The hero: a report that assembles itself from evidence cards, then gets stamped. */
export function HeroReceipt() {
  const reduce = useReducedMotion();
  return (
    <div className="relative mx-auto h-[30rem] w-full max-w-lg" aria-hidden>
      {t.evidence.map((e, i) => (
        <motion.div
          key={e.source}
          className={`absolute z-0 ${spots[i].className}`}
          initial={reduce ? false : { opacity: 0, ...spots[i].from }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14, delay: 0.15 + i * 0.25 }}
        >
          <EvidenceCard compact evidence={{ ...e, capturedAt: "2026-11-10T06:12:00Z" }} />
        </motion.div>
      ))}

      <motion.div
        className="paper-shadow absolute top-14 left-1/2 z-10 w-72 -translate-x-1/2"
        initial={reduce ? false : { opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 140, damping: 16, delay: 0.7 }}
      >
        <div className="zigzag-bottom bg-surface px-5 pt-5">
          <p className="flex items-center gap-2 font-heading font-bold">
            <LogoMark size={22} /> {t.reportTitle}
          </p>
          <p className="mt-0.5 font-mono text-xs text-ink-muted">{t.reportOrg}</p>
          <ul className="dashed-rule mt-3 space-y-2.5 pt-3">
            {t.reportLines.map((line, i) => {
              const Icon = statusIcons[line.status];
              return (
                <motion.li
                  key={line.label}
                  className="flex items-center justify-between gap-3 text-sm"
                  initial={reduce ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 1.2 + i * 0.22 }}
                >
                  <span>{line.label}</span>
                  <Icon className={`size-4 shrink-0 ${lineColor[line.status]}`} />
                </motion.li>
              );
            })}
          </ul>
          <div className="dashed-rule mt-3 flex items-end justify-between pt-3">
            <div>
              <p className="text-xs text-ink-muted">{copy.report.scoreLabel}</p>
              <p className="tabular font-mono text-3xl font-bold">
                72<span className="text-sm font-normal text-ink-muted"> / 100</span>
              </p>
            </div>
            <Stamp delay={reduce ? 0 : 2.3} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
