"use client";

import { useState } from "react";
import { ArrowRight, Copy, GitCompareArrows } from "lucide-react";
import {
  Button,
  ButtonLink,
  DataTable,
  EmptyState,
  Field,
  Modal,
  PageLoading,
  Select,
  StatusPill,
} from "@/design-system/components";
import { copy } from "@/content/copy";
import { formatDateTime } from "@/lib/format";
import { compareReports } from "@/lib/report";
import { scoreBand } from "@/lib/scoring";
import { useQuery } from "@/lib/use-query";
import { listReports } from "@/mocks/service";
import type { Report } from "@/mocks/types";
import { ErrorState } from "./ErrorState";

const t = copy.reports;
const regName = (r: Report) => (r.regulationId === "all" ? copy.wizard.allName : copy.regulations[r.regulationId]);

export function Reports() {
  const { data, error, reload } = useQuery("reports", listReports);
  const [compare, setCompare] = useState<Report | null>(null);

  if (error) return <ErrorState onRetry={reload} />;
  if (!data) return <PageLoading label={t.loading} />;

  return (
    <div className="space-y-6" data-testid="reports">
      <p className="text-ink-muted">{t.subtitle}</p>
      <DataTable
        caption={t.title}
        rows={data}
        rowKey={(r) => r.id}
        empty={
          <EmptyState
            title={t.emptyTitle}
            body={t.emptyBody}
            action={
              <ButtonLink href="/app/reports/new" variant="secondary">
                {copy.common.generateAuditReport}
              </ButtonLink>
            }
          />
        }
        columns={[
          {
            key: "date",
            header: t.cols.date,
            render: (r) => (
              <>
                <span className="font-mono text-xs whitespace-nowrap">{formatDateTime(r.createdAt)}</span>
                <span className="block font-mono text-[11px] text-ink-muted">{r.id}</span>
              </>
            ),
          },
          { key: "regulation", header: t.cols.regulation, render: (r) => <span className="font-semibold">{regName(r)}</span> },
          { key: "audience", header: t.cols.audience, render: (r) => copy.audiences[r.audience].name },
          {
            key: "score",
            header: t.cols.score,
            render: (r) => (
              <>
                <span className="tabular font-mono text-lg font-bold">{r.score}</span>
                <span className="block text-xs text-ink-muted">{copy.scoreWords[scoreBand(r.score)]}</span>
              </>
            ),
          },
          { key: "status", header: t.cols.status, render: (r) => <span className="text-xs whitespace-nowrap">{t.counts(r.statusCounts)}</span> },
          {
            key: "actions",
            header: t.cols.actions,
            align: "right",
            render: (r) => (
              <span className="flex flex-wrap justify-end gap-2">
                <ButtonLink href={`/app/reports/new?from=${r.id}`} variant="ghost" size="sm" icon={<Copy aria-hidden />}>
                  {t.duplicate}
                </ButtonLink>
                <Button variant="ghost" size="sm" icon={<GitCompareArrows aria-hidden />} onClick={() => setCompare(r)}>
                  {t.compare}
                </Button>
                <ButtonLink href={`/app/reports/${r.id}`} variant="secondary" size="sm" data-testid="open-report">
                  {t.open}
                  <ArrowRight aria-hidden />
                </ButtonLink>
              </span>
            ),
          },
        ]}
      />
      {compare ? <CompareModal report={compare} others={data.filter((r) => r.id !== compare.id)} onClose={() => setCompare(null)} /> : null}
    </div>
  );
}

function CompareModal({ report, others, onClose }: { report: Report; others: Report[]; onClose: () => void }) {
  const [otherId, setOtherId] = useState(others[0]?.id ?? "");
  const other = others.find((r) => r.id === otherId);
  const pair = other
    ? [report, other].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    : null;
  const diff = pair ? compareReports(pair[0], pair[1]) : null;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={t.compareTitle} description={t.compareBody}>
      {!other || !diff || !pair ? (
        <p className="text-ink-muted">{t.compareNone}</p>
      ) : (
        <div className="space-y-5">
          <Field label={t.compareWith} htmlFor="compare-with">
            <Select id="compare-with" value={otherId} onChange={(e) => setOtherId(e.target.value)}>
              {others.map((r) => (
                <option key={r.id} value={r.id}>
                  {regName(r)} · {formatDateTime(r.createdAt)}
                </option>
              ))}
            </Select>
          </Field>
          <div className="flex items-center justify-center gap-4 rounded-2xl bg-paper-deep p-4 font-mono">
            <span className="text-3xl font-bold">{pair[0].score}</span>
            <ArrowRight className="size-5 text-ink-muted" aria-hidden />
            <span className="text-3xl font-bold">{pair[1].score}</span>
          </div>
          <p className="font-semibold">{t.scoreChange(diff.scoreDelta)}</p>
          {diff.changes.length === 0 ? (
            <p className="text-ink-muted">{t.noChanges}</p>
          ) : (
            <>
              <p className="text-sm text-ink-muted">{t.changed(diff.changes.length)}</p>
              <ul className="space-y-3">
                {diff.changes.map((c) => (
                  <li key={c.controlId} className="rounded-2xl border border-line p-3">
                    <span className="block text-sm font-semibold">{c.plainTitle}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-2">
                      <StatusPill status={c.from} size="sm" />
                      <ArrowRight className="size-4 text-ink-muted" aria-hidden />
                      <StatusPill status={c.to} size="sm" />
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </Modal>
  );
}
