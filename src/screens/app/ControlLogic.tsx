"use client";

import { Database, GitBranch, Lightbulb, Plug, ShieldCheck } from "lucide-react";
import { Badge, CodeBlock, Modal, StatusPill } from "@/design-system/components";
import { copy } from "@/content/copy";
import type { Control, Evidence, EvidenceMethod } from "@/mocks/types";

const t = copy.logic;
const viaIcon = { sql: Database, rest: Plug, git: GitBranch } satisfies Record<EvidenceMethod["via"], typeof Database>;

function Rows({ method }: { method: EvidenceMethod }) {
  if (method.rows.length === 0) {
    return <p className="rounded-xl border border-dashed border-line-strong px-4 py-3 font-mono text-xs text-ink-muted">{t.noRows}</p>;
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full border-collapse text-left font-mono text-xs">
        <thead>
          <tr className="bg-paper-deep text-ink-muted">
            {method.columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 font-semibold whitespace-nowrap">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {method.rows.map((row, i) => (
            <tr key={i} className="border-t border-line">
              {row.map((cell, j) => (
                <td key={j} className="tabular px-3 py-2 whitespace-nowrap">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
          {method.more ? (
            <tr className="border-t border-line">
              <td colSpan={method.columns.length} className="px-3 py-2 text-ink-muted">
                {t.moreRows(method.more)}
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

/** "Show how we got this answer": the rule, then every check with its query, sample rows and reading. */
export function ControlLogic({
  control,
  evidence,
  open,
  onOpenChange,
}: {
  control: Control;
  evidence: Evidence[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} size="lg" title={t.title} description={control.plainTitle}>
      <div className="space-y-6" data-testid="control-logic">
        <div className="flex flex-wrap items-start gap-3">
          <p className="min-w-0 flex-1 text-sm text-ink-muted">{t.intro}</p>
          <Badge tone="sun">{copy.common.sampleData}</Badge>
        </div>

        <section className="rounded-2xl border border-line bg-surface p-4" aria-labelledby="logic-rule">
          <h3 id="logic-rule" className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            {t.ruleTitle}
          </h3>
          <p className="mt-1.5">{control.logic.rule}</p>
          <h3 className="mt-4 text-xs font-bold tracking-wide text-ink-muted uppercase">{t.resultTitle}</h3>
          <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-2">
            <span className="font-semibold">{control.logic.result}</span>
            <StatusPill status={control.status} size="sm" />
          </p>
        </section>

        <section aria-labelledby="logic-checks">
          <h3 id="logic-checks" className="text-xs font-bold tracking-wide text-ink-muted uppercase">
            {t.checksTitle}
          </h3>
          <ol className="mt-3 space-y-6">
            {evidence.map((e, i) => {
              const Icon = viaIcon[e.method.via];
              return (
                <li key={e.id} className="rounded-2xl border border-line p-4" data-testid="logic-check">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex size-7 items-center justify-center rounded-full bg-brand font-mono text-xs font-bold text-brand-ink">
                      {i + 1}
                    </span>
                    <span className="font-mono text-xs text-ink-muted">{t.check(i + 1, evidence.length)}</span>
                    <Badge tone="brand">
                      <Icon className="size-3.5" aria-hidden />
                      {t.via[e.method.via]}
                    </Badge>
                  </div>
                  <p className="mt-2 font-semibold">{e.summary}</p>
                  <p className="mt-0.5 text-xs text-ink-muted">{t.viaHelp[e.method.via]}</p>

                  <CodeBlock
                    className="mt-3"
                    code={e.method.query}
                    label={e.source}
                    copyLabel={t.copyQuery}
                    copiedMessage={t.copied}
                  />

                  <h4 className="mt-4 mb-1.5 text-xs font-bold tracking-wide text-ink-muted uppercase">{t.cameBack}</h4>
                  <Rows method={e.method} />

                  <h4 className="mt-4 text-xs font-bold tracking-wide text-ink-muted uppercase">{t.weRead}</h4>
                  <p className="mt-1 text-sm">{e.method.reading}</p>

                  {e.method.note ? (
                    <p className="mt-3 flex gap-2 rounded-xl bg-brand-soft px-3 py-2 text-xs">
                      <Lightbulb className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      <span>
                        <span className="font-semibold">{t.goodToKnow}: </span>
                        {e.method.note}
                      </span>
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </section>

        <p className="flex gap-2 text-xs text-ink-muted">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-pass-ink" aria-hidden />
          {t.connection}
        </p>
      </div>
    </Modal>
  );
}
