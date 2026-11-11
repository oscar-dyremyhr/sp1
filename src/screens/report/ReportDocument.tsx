import { DataTable, LogoMark, ScoreGauge, StatusPill, type Column } from "@/design-system/components";
import { copy } from "@/content/copy";
import { formatDate, formatDateTime } from "@/lib/format";
import { countStatuses, readinessScore, scoreBand } from "@/lib/scoring";
import type { ControlSnapshot, ControlStatus, Evidence, EvidenceType, RegulationId, Report } from "@/mocks/types";

const t = copy.report;
const statuses: ControlStatus[] = ["pass", "watch", "fix"];
const regOrder: RegulationId[] = ["dora", "bcbs239", "gdpr"];

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mb-4 border-b-2 border-ink pb-2 text-2xl font-bold">{children}</h2>;
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{label}</dt>
      <dd className="mt-0.5 font-medium">{value}</dd>
    </div>
  );
}

type EvidenceRow = Evidence & { controlRef: string };

function evidenceOfType(report: Report, type: EvidenceType): EvidenceRow[] {
  return report.controlSnapshots.flatMap((c) =>
    c.evidence.filter((e) => e.type === type).map((e) => ({ ...e, controlRef: c.ref })),
  );
}

function Appendix({ title, rows, empty }: { title: string; rows: EvidenceRow[]; empty: string }) {
  return (
    <section className="mt-12">
      <SectionTitle>{title}</SectionTitle>
      {rows.length === 0 ? (
        <p className="text-ink-muted">{empty}</p>
      ) : (
        <DataTable
          caption={title}
          rows={rows}
          rowKey={(r) => r.id}
          className="shadow-none"
          columns={[
            { key: "source", header: t.appendix.source, render: (r) => <span className="font-mono text-xs break-all">{r.source}</span> },
            {
              key: "finding",
              header: t.appendix.finding,
              render: (r) => (
                <>
                  {r.summary}
                  {r.details ? <span className="block text-xs text-ink-muted">{r.details}</span> : null}
                </>
              ),
            },
            { key: "control", header: t.appendix.control, render: (r) => <span className="text-xs">{r.controlRef}</span> },
            {
              key: "captured",
              header: t.appendix.captured,
              render: (r) => <span className="font-mono text-xs whitespace-nowrap">{formatDate(r.capturedAt)}</span>,
            },
          ]}
        />
      )}
    </section>
  );
}

/**
 * The report itself: cover, executive summary, readiness, control table and
 * appendices. Formal wording, no app chrome, no mascot. Prints as a clean PDF.
 */
export function ReportDocument({ report }: { report: Report }) {
  const regulationName = report.regulationId === "all" ? t.allRegulations : copy.regulations[report.regulationId];
  const scope = copy.wizard.scopeSummary(report.scope.workspaceIds.length, report.scope.catalogs.length);
  const counts = report.statusCounts;
  const total = report.controlSnapshots.length;
  const band = scoreBand(report.score);
  const fixes = report.controlSnapshots.filter((c) => c.status === "fix");
  const watches = report.controlSnapshots.filter((c) => c.status === "watch");
  const detail = report.audience !== "board";

  const columns: Column<ControlSnapshot>[] = [
    {
      key: "control",
      header: t.table.control,
      className: "w-[34%]",
      render: (c) => (
        <>
          <span className="block font-mono text-xs text-ink-muted">{c.ref}</span>
          <span className="mt-0.5 block font-semibold">{c.formalTitle}</span>
          <span className="mt-0.5 block text-xs text-ink-muted italic">{c.plainTitle}</span>
        </>
      ),
    },
    {
      key: "status",
      header: t.table.status,
      render: (c) => (
        <>
          <StatusPill status={c.status} size="sm" />
          <span className="mt-1 block text-xs text-ink-muted">{t.statusFormal[c.status]}</span>
        </>
      ),
    },
    {
      key: "evidence",
      header: t.table.evidence,
      render: (c) =>
        detail ? (
          <ul className="space-y-2">
            <li className="text-sm">{c.explanation}</li>
            {c.evidence.map((e) => (
              <li key={e.id} className="text-xs">
                <span className="font-semibold">{copy.evidenceTypes[e.type]}:</span> {e.summary}
                <span className="block font-mono text-[11px] break-all text-ink-muted">{e.source}</span>
              </li>
            ))}
          </ul>
        ) : (
          <>
            <span className="block text-sm">{c.explanation}</span>
            <span className="mt-1 block font-mono text-xs text-ink-muted">{t.table.evidenceItems(c.evidence.length)}</span>
          </>
        ),
    },
  ];
  if (report.audience === "internal") {
    columns.push({
      key: "fix",
      header: t.table.remediation,
      render: (c) =>
        c.fixSteps.length === 0 ? (
          <span className="text-xs text-ink-muted">{t.table.noAction}</span>
        ) : (
          <>
            <ol className="list-decimal space-y-1 pl-4 text-xs">
              {c.fixSteps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
            <span className="mt-1.5 block text-xs font-semibold">{c.owner}</span>
          </>
        ),
    });
  }

  return (
    <article className="report text-[15px] leading-relaxed" data-testid="report-document" data-report-id={report.id}>
      {/* ---------- Cover ---------- */}
      <section className="print-page-break flex min-h-[38rem] flex-col print:min-h-[250mm]" data-testid="report-cover">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 font-heading text-xl font-extrabold">
            <LogoMark /> {copy.brand.name}
          </span>
          <span className="rounded-full border border-ink px-3 py-0.5 text-xs font-semibold tracking-widest uppercase">
            {t.confidential}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center py-12">
          <p className="font-mono text-sm text-ink-muted">{regulationName}</p>
          <h1 className="mt-2 text-5xl leading-tight font-extrabold">{t.docTitle}</h1>
          <p className="mt-3 text-2xl font-semibold">{report.orgName}</p>
          <div className="mt-10 flex flex-wrap items-center gap-6 rounded-card border border-line p-6 print-plain">
            <div>
              <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">{t.scoreLabel}</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="tabular font-mono text-6xl font-bold" data-testid="report-score">
                  {report.score}
                </span>
                <span className="font-mono text-ink-muted">/ 100</span>
              </p>
              <p className="font-semibold">{copy.scoreWords[band]}</p>
            </div>
            <ul className="flex flex-wrap gap-3">
              {statuses.map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span className="tabular font-mono text-xl font-bold">{counts[s]}</span>
                  <StatusPill status={s} size="sm" />
                </li>
              ))}
            </ul>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-8 gap-y-4 border-t border-line pt-6 sm:grid-cols-3">
          <Meta label={t.preparedFor} value={report.orgName} />
          <Meta label={t.preparedBy} value={report.createdBy} />
          <Meta label={t.generated} value={formatDateTime(report.createdAt)} />
          <Meta label={t.reportId} value={report.id} />
          <Meta label={t.audience} value={copy.audiences[report.audience].name} />
          <Meta label={t.scope} value={scope} />
        </dl>
        <p className="mt-6 text-xs text-ink-muted">{t.sampleNotice}</p>
      </section>

      {/* ---------- 1. Executive summary ---------- */}
      <section className="mt-12 print:mt-0">
        <SectionTitle>{t.sections.summary}</SectionTitle>
        <p>
          {t.summary({
            org: report.orgName,
            regulation: regulationName,
            total,
            pass: counts.pass,
            watch: counts.watch,
            fix: counts.fix,
            score: report.score,
            scope,
          })}
        </p>
        <p className="mt-3 text-sm text-ink-muted">{t.method}</p>

        <h3 className="mt-8 text-lg font-bold">{t.findingsTitle}</h3>
        {fixes.length === 0 ? (
          <p className="mt-2 text-ink-muted">{t.noFindings}</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {fixes.map((c) => (
              <li key={c.id} className="print-avoid-break rounded-2xl border border-line p-4">
                <span className="flex flex-wrap items-center gap-2">
                  <StatusPill status="fix" size="sm" />
                  <span className="font-mono text-xs text-ink-muted">{c.ref}</span>
                </span>
                <span className="mt-1.5 block font-semibold">{c.formalTitle}</span>
                <span className="block text-sm">{c.explanation}</span>
              </li>
            ))}
          </ul>
        )}
        {watches.length > 0 ? (
          <>
            <h3 className="mt-8 text-lg font-bold">{t.watchTitle}</h3>
            <ul className="mt-3 space-y-2">
              {watches.map((c) => (
                <li key={c.id} className="print-avoid-break text-sm">
                  <span className="font-mono text-xs text-ink-muted">{c.ref}</span>
                  <span className="block">{c.explanation}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </section>

      {/* ---------- 2. Readiness ---------- */}
      <section className="print-avoid-break mt-12">
        <SectionTitle>{t.sections.readiness}</SectionTitle>
        <div className="flex flex-wrap items-center gap-x-10 gap-y-6">
          <ScoreGauge score={report.score} size={200} animate={false} />
          <table className="min-w-72 flex-1 border-collapse text-sm">
            <caption className="sr-only">{t.sections.readiness}</caption>
            <thead>
              <tr className="border-b border-line text-left text-xs tracking-wide text-ink-muted uppercase">
                <th scope="col" className="py-2 pr-4 font-semibold">
                  {t.regulation}
                </th>
                {statuses.map((s) => (
                  <th key={s} scope="col" className="px-2 py-2 text-right font-semibold">
                    {t.statusFormal[s]}
                  </th>
                ))}
                <th scope="col" className="py-2 pl-2 text-right font-semibold">
                  {t.scoreLabel}
                </th>
              </tr>
            </thead>
            <tbody>
              {regOrder
                .filter((id) => report.controlSnapshots.some((c) => c.regulationId === id))
                .map((id) => {
                  const c = countStatuses(report.controlSnapshots.filter((x) => x.regulationId === id));
                  return (
                    <tr key={id} className="border-b border-line">
                      <th scope="row" className="py-2.5 pr-4 text-left font-semibold">
                        {copy.regulations[id]}
                      </th>
                      {statuses.map((s) => (
                        <td key={s} className="tabular px-2 py-2.5 text-right font-mono">
                          {c[s]}
                        </td>
                      ))}
                      <td className="tabular py-2.5 pl-2 text-right font-mono font-bold">{readinessScore(c)}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ---------- 3. Controls ---------- */}
      <section className="mt-12">
        <SectionTitle>{t.sections.controls}</SectionTitle>
        <DataTable
          caption={t.table.caption}
          rows={report.controlSnapshots}
          rowKey={(c) => c.id}
          columns={columns}
          className="shadow-none"
        />
      </section>

      {/* ---------- Appendices ---------- */}
      {detail ? (
        <>
          <Appendix title={t.sections.appendixA} rows={evidenceOfType(report, "lineage")} empty={t.appendix.emptyLineage} />
          <Appendix title={t.sections.appendixB} rows={evidenceOfType(report, "access_grant")} empty={t.appendix.emptyAccess} />
        </>
      ) : (
        <p className="mt-12 text-sm text-ink-muted">{t.appendix.boardNote}</p>
      )}

      <footer className="mt-12 border-t border-line pt-4 text-center text-xs text-ink-muted">
        <p className="font-semibold tracking-widest uppercase">{t.end}</p>
        <p className="mt-1">{t.poweredBy}</p>
        <p className="mt-1 font-mono">
          {report.id} · {formatDateTime(report.createdAt)}
        </p>
      </footer>
    </article>
  );
}
