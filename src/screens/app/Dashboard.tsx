"use client";

import Link from "next/link";
import { ArrowRight, Ticket } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import {
  Badge,
  ButtonLink,
  Card,
  EmptyState,
  PageLoading,
  ScoreGauge,
  StatusPill,
  statusIcons,
} from "@/design-system/components";
import { copy } from "@/content/copy";
import { formatDate, formatDateTime } from "@/lib/format";
import { useQuery } from "@/lib/use-query";
import { getDashboard } from "@/mocks/service";
import type { ControlStatus } from "@/mocks/types";
import { useDataMap } from "@/store/datamap";
import { ErrorState } from "./ErrorState";

const t = copy.dashboard;
const statuses: ControlStatus[] = ["pass", "watch", "fix"];
const barColor = { pass: "bg-pass", watch: "bg-watch", fix: "bg-fix" };
const wordColor = { pass: "text-pass-ink", watch: "text-watch-ink", fix: "text-fix-ink" };

function StatusWord({ status }: { status: ControlStatus }) {
  const Icon = statusIcons[status];
  return (
    <span className={`flex items-center justify-center gap-1 text-xs leading-tight font-semibold ${wordColor[status]}`}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {copy.status[status]}
    </span>
  );
}

export function Dashboard() {
  const { data, error, reload } = useQuery("dashboard", getDashboard);
  const mapConfirmed = useDataMap((s) => s.map !== null);
  if (error) return <ErrorState onRetry={reload} />;
  if (!data) return <PageLoading label={t.loading} />;

  return (
    <div className="space-y-6" data-testid="dashboard">
      <p className="text-ink-muted">{t.subtitle(data.org.name)}</p>

      {mapConfirmed ? null : (
        <div className="flex flex-wrap items-center gap-4 rounded-card bg-sun px-6 py-4 text-on-accent" data-testid="map-banner">
          <div className="min-w-0 flex-1">
            <p className="font-heading text-lg font-bold">{copy.dataMap.banner.title}</p>
            <p className="text-sm">{copy.dataMap.banner.body}</p>
          </div>
          <ButtonLink href="/app/data-map" variant="secondary" size="sm">
            {copy.dataMap.banner.cta}
          </ButtonLink>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <h2 className="text-lg font-bold">{t.readiness}</h2>
          <p className="text-sm text-ink-muted">{t.readinessHelp}</p>
          <div className="mt-2 flex justify-center">
            <ScoreGauge score={data.score} size={240} />
          </div>
          <ul className="mt-4 grid grid-cols-3 gap-2" aria-label={t.byStatus}>
            {statuses.map((s) => (
              <li key={s}>
                <Link
                  href={`/app/controls?status=${s}`}
                  className="flex flex-col items-center gap-1.5 rounded-2xl border border-line p-3 text-center transition-transform duration-200 ease-spring hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <span className="tabular font-mono text-2xl font-bold" data-testid={`count-${s}`}>
                    {data.counts[s]}
                  </span>
                  <StatusWord status={s} />
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-xs text-ink-muted">
            {t.controlsChecked(data.totalControls)}
            {data.lastScanAt ? ` · ${t.lastScan(formatDateTime(data.lastScanAt))}` : ""}
          </p>
        </Card>

        <Card className="lg:col-span-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold">{t.topFixes}</h2>
            <Link href="/app/controls" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {t.seeControls}
            </Link>
          </div>
          {data.topFixes.length === 0 ? (
            <EmptyState className="mt-4 border-0" mood="party" title={t.topFixesEmptyTitle} body={t.topFixesEmptyBody} />
          ) : (
            <ol className="mt-4 space-y-3">
              {data.topFixes.map((c, i) => (
                <li key={c.id}>
                  <Link
                    href={`/app/controls?control=${c.id}`}
                    className="group flex items-start gap-4 rounded-2xl border border-line p-4 transition-transform duration-200 ease-spring hover:-translate-y-0.5 hover:border-line-strong"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-paper-deep font-mono text-sm font-bold">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{c.plainTitle}</span>
                      <span className="mt-0.5 block text-sm text-ink-muted">{c.explanation}</span>
                      <span className="mt-2 flex flex-wrap items-center gap-2">
                        <StatusPill status={c.status} size="sm" />
                        <span className="text-xs text-ink-muted">{t.whoFixes(c.owner)}</span>
                      </span>
                    </span>
                    <span className="flex items-center gap-1 self-center text-sm font-semibold whitespace-nowrap text-brand max-sm:sr-only">
                      {t.seeHow}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-lg font-bold">{t.byRegulation}</h2>
          <ul className="mt-4 space-y-4">
            {data.byRegulation.map((r) => {
              const total = r.counts.pass + r.counts.watch + r.counts.fix;
              return (
                <li key={r.id}>
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone={r.id === "dora" ? "brand" : r.id === "bcbs239" ? "mint" : "sun"}>{r.name}</Badge>
                    <span className="tabular font-mono text-sm font-bold">
                      {r.score}
                      <span className="font-normal text-ink-muted"> / 100</span>
                    </span>
                  </div>
                  <div className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full" aria-hidden>
                    {statuses.map((s) =>
                      r.counts[s] > 0 ? (
                        <span key={s} className={barColor[s]} style={{ width: `${(r.counts[s] / total) * 100}%` }} />
                      ) : null,
                    )}
                  </div>
                  <p className="mt-1 text-xs text-ink-muted">{copy.reports.counts(r.counts)}</p>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card>
          <h2 className="text-lg font-bold">{t.trendTitle}</h2>
          <div className="mt-4 h-40" role="img" aria-label={t.trendAria}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.trend} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
                <defs>
                  <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="var(--brand)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} />
                <YAxis domain={[40, 100]} tickLine={false} axisLine={false} tick={{ fill: "var(--ink-muted)", fontSize: 12 }} tickCount={4} />
                <ChartTooltip
                  cursor={{ stroke: "var(--line-strong)" }}
                  contentStyle={{
                    background: "var(--surface)",
                    border: "1px solid var(--line)",
                    borderRadius: 12,
                    color: "var(--ink)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name={t.readiness}
                  stroke="var(--brand)"
                  strokeWidth={3}
                  fill="url(#trend-fill)"
                  dot={{ r: 3, fill: "var(--brand)", strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="flex flex-col">
          <h2 className="text-lg font-bold">{t.creditsTitle}</h2>
          <p className="mt-3 flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-sun text-on-accent">
              <Ticket className="size-6" aria-hidden />
            </span>
            <span className="tabular font-mono text-4xl font-bold">{data.org.credits}</span>
          </p>
          <p className="mt-2 flex-1 text-sm text-ink-muted">{t.creditsBody(data.org.credits)}</p>
          <ButtonLink href="/app/billing" variant="secondary" size="sm" className="mt-4 self-start">
            {t.getMore}
          </ButtonLink>
        </Card>
      </div>

      <section aria-labelledby="recent-title">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="recent-title" className="text-lg font-bold">
            {t.recentReports}
          </h2>
          {data.recentReports.length > 0 ? (
            <Link href="/app/reports" className="text-sm font-semibold text-brand underline-offset-4 hover:underline">
              {t.viewAll}
            </Link>
          ) : null}
        </div>
        {data.recentReports.length === 0 ? (
          <EmptyState title={t.noReportsTitle} body={t.noReportsBody} />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-3">
            {data.recentReports.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/app/reports/${r.id}`}
                  className="paper-shadow block transition-transform duration-200 ease-spring hover:-translate-y-1"
                >
                  <span className="zigzag-bottom block bg-surface px-5 pt-4">
                    <span className="block font-semibold">
                      {r.regulationId === "all" ? copy.wizard.allName : copy.regulations[r.regulationId]}
                    </span>
                    <span className="mt-0.5 block font-mono text-xs text-ink-muted">{formatDate(r.createdAt)}</span>
                    <span className="dashed-rule mt-3 flex items-baseline justify-between pt-2">
                      <span className="text-xs text-ink-muted">{copy.report.scoreLabel}</span>
                      <span className="tabular font-mono text-xl font-bold">{r.score}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
