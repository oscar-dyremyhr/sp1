"use client";

import { Mail, Ticket } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
import { Badge, Button, Card, DataTable, EmptyState, PageLoading, buttonClass } from "@/design-system/components";
import { copy } from "@/content/copy";
import { type PackId, getPlan, packSaving, pricing } from "@/content/pricing";
import { formatDate, formatEuro } from "@/lib/format";
import { useQuery } from "@/lib/use-query";
import { getBilling } from "@/mocks/service";
import { useCredits } from "@/store/credits";
import { ErrorState } from "./ErrorState";
import { openCheckout } from "./Paywall";

const t = copy.billing;
const packIds: PackId[] = ["single", "pack5"];

export function Billing() {
  // Re-load whenever a purchase changes the numbers.
  const credits = useCredits((s) => s.credits);
  const planId = useCredits((s) => s.plan);
  const invoiceCount = useCredits((s) => s.invoices.length);
  const { data, error, reload } = useQuery(`billing:${credits}:${planId}:${invoiceCount}`, getBilling);

  if (error) return <ErrorState onRetry={reload} />;
  if (!data) return <PageLoading label={t.loading} />;

  const plan = getPlan(data.org.plan);
  const team = getPlan("team");

  return (
    <div className="space-y-6" data-testid="billing">
      <p className="text-ink-muted">{t.subtitle}</p>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <h2 className="text-sm font-semibold text-ink-muted">{t.currentPlan}</h2>
          <p className="mt-2 font-heading text-3xl font-extrabold" data-testid="current-plan">
            {plan.name}
          </p>
          <p className="mt-1 text-sm text-ink-muted">{plan.seatsLabel}</p>
          {data.org.plan === "trial" ? (
            <Badge tone="sun" className="mt-3">
              {t.trialEnds(formatDate(data.org.trialEndsAt))}
            </Badge>
          ) : null}
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-ink-muted">{t.creditsLeft}</h2>
          <p className="mt-2 flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-sun text-on-accent">
              <Ticket className="size-5" aria-hidden />
            </span>
            <span className="tabular font-mono text-4xl font-bold" data-testid="billing-credits">
              {data.org.credits}
            </span>
          </p>
          <p className="mt-2 text-sm text-ink-muted">{t.creditsHelp}</p>
        </Card>
        <Card>
          <h2 className="text-sm font-semibold text-ink-muted">{t.usage}</h2>
          <p className="tabular mt-2 font-mono text-4xl font-bold">{data.reportsThisMonth}</p>
          <div className="mt-2 h-20" role="img" aria-label={t.usageAria}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.usage} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--ink-muted)", fontSize: 11 }} />
                <YAxis hide allowDecimals={false} domain={[0, (max: number) => Math.max(max, 2)]} />
                <ChartTooltip
                  cursor={{ fill: "var(--paper-deep)" }}
                  contentStyle={{ background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 12, color: "var(--ink)", fontSize: 12 }}
                />
                <Bar dataKey="reports" name={t.usageChart} fill="var(--brand)" radius={[6, 6, 0, 0]} minPointSize={3} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold">{t.buyTitle}</h2>
          <ul className="mt-4 space-y-3">
            {packIds.map((id) => {
              const pack = pricing.packs[id];
              return (
                <li key={id} className="flex items-center gap-4 rounded-2xl border border-line p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{pack.name}</p>
                    <p className="text-sm text-ink-muted">
                      {id === "pack5" ? copy.paywall.pack5.body(formatEuro(packSaving())) : copy.paywall.single.body}
                    </p>
                  </div>
                  <span className="tabular font-mono text-xl font-bold">{formatEuro(pack.price)}</span>
                  <Button variant="secondary" size="sm" onClick={() => openCheckout({ kind: "pack", packId: id })} data-testid={`buy-${id}`}>
                    {t.buy}
                  </Button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="flex flex-col">
          <h2 className="text-lg font-bold">{t.upgradeTitle}</h2>
          {data.org.plan === "team" || data.org.plan === "enterprise" ? (
            <p className="mt-3 rounded-2xl bg-pass-soft px-4 py-3 text-sm font-medium text-pass-ink">{t.onTeam}</p>
          ) : (
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-line p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {team.name} · <span className="tabular font-mono">{formatEuro(team.monthly ?? 0)}</span>{" "}
                  <span className="text-sm font-normal text-ink-muted">{copy.paywall.perMonth}</span>
                </p>
                <p className="text-sm text-ink-muted">{t.upgradeBody}</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => openCheckout({ kind: "plan", planId: "team" })} data-testid="upgrade-team">
                {t.upgradeCta}
              </Button>
            </div>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-dashed border-line-strong p-4">
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t.enterpriseTitle}</p>
              <p className="text-sm text-ink-muted">{t.enterpriseBody}</p>
            </div>
            <a href={`mailto:${copy.brand.contactEmail}`} className={buttonClass({ variant: "ghost", size: "sm" })}>
              <Mail aria-hidden />
              {t.contact}
            </a>
          </div>
        </Card>
      </div>

      <section aria-labelledby="invoices-title">
        <h2 id="invoices-title" className="mb-3 text-lg font-bold">
          {t.invoices}
        </h2>
        <DataTable
          caption={t.invoices}
          rows={data.invoices}
          rowKey={(i) => i.id}
          empty={<EmptyState title={t.noInvoicesTitle} body={t.noInvoicesBody} mood="sleepy" />}
          columns={[
            { key: "id", header: t.invoiceCols.id, render: (i) => <span className="font-mono">{i.id}</span> },
            { key: "date", header: t.invoiceCols.date, render: (i) => <span className="font-mono text-xs">{formatDate(i.date)}</span> },
            { key: "what", header: t.invoiceCols.what, render: (i) => i.description },
            { key: "status", header: t.invoiceCols.status, render: () => <Badge tone="mint">{t.paid}</Badge> },
            {
              key: "amount",
              header: t.invoiceCols.amount,
              align: "right",
              render: (i) => <span className="tabular font-mono font-semibold">{formatEuro(i.amount)}</span>,
            },
          ]}
        />
      </section>
    </div>
  );
}
