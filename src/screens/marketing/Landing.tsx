import { ArrowRight, Check, Eye, KeyRound, Plug, ScanSearch, Send, ShieldCheck, X } from "lucide-react";
import { Badge, ButtonLink, Card, StatusPill, Stubby } from "@/design-system/components";
import { copy } from "@/content/copy";
import { countStatuses, readinessScore } from "@/lib/scoring";
import { controls } from "@/mocks/fixtures/controls";
import { allRegulations } from "@/mocks/service";
import { HeroReceipt } from "./HeroReceipt";

const t = copy.marketing;
const stepIcons = [Plug, ScanSearch, Send];
const securityIcons = [Eye, ShieldCheck, KeyRound];
const regTone = { dora: "brand", bcbs239: "mint", gdpr: "sun" } as const;
const regTilt = ["-rotate-2", "rotate-1", "-rotate-1"];

function Section({ id, title, children, band }: { id: string; title: string; children: React.ReactNode; band?: boolean }) {
  return (
    <section aria-labelledby={id} className={band ? "bg-paper-deep" : undefined}>
      <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
        <h2 id={id} className="max-w-2xl text-3xl font-extrabold md:text-4xl">
          {title}
        </h2>
        {children}
      </div>
    </section>
  );
}

export function Landing() {
  const previewControls = controls.filter((c) => ["dora-a9-01", "bcbs-p3-01", "gdpr-a5-01"].includes(c.id));
  const score = readinessScore(countStatuses(controls));

  return (
    <>
      {/* ---------- Hero ---------- */}
      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pt-12 pb-16 md:grid-cols-2 md:pt-16">
        <div>
          <Badge tone="sun">{t.hero.eyebrow}</Badge>
          <h1 className="mt-5 text-5xl leading-[1.05] font-extrabold tracking-tight md:text-6xl">{t.hero.title}</h1>
          <p className="mt-5 max-w-lg text-lg text-ink-muted">{t.hero.body}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <ButtonLink href="/signup" size="lg" data-testid="hero-cta">
              {copy.common.startTrial}
              <ArrowRight aria-hidden />
            </ButtonLink>
            <ButtonLink href="/sample-report" size="lg" variant="secondary">
              {t.hero.secondary}
            </ButtonLink>
          </div>
          <p className="mt-4 text-sm text-ink-muted">{t.hero.note}</p>
        </div>
        <HeroReceipt />
      </section>

      {/* ---------- How it works ---------- */}
      <Section id="how" title={t.how.title} band>
        <ol className="mt-10 grid gap-6 md:grid-cols-3">
          {t.how.steps.map((step, i) => {
            const Icon = stepIcons[i];
            return (
              <li key={step.name}>
                <Card className="h-full">
                  <span className="flex items-center gap-3">
                    <span className="flex size-12 items-center justify-center rounded-2xl bg-brand text-brand-ink">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <span className="font-mono text-sm text-ink-muted">0{i + 1}</span>
                  </span>
                  <h3 className="mt-4 text-xl font-bold">{step.name}</h3>
                  <p className="mt-1.5 text-ink-muted">{step.body}</p>
                </Card>
              </li>
            );
          })}
        </ol>
      </Section>

      {/* ---------- Regulations ---------- */}
      <Section id="regs" title={t.regs.title}>
        <p className="mt-2 text-ink-muted">{t.regs.body}</p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {allRegulations().map((r, i) => (
            <li key={r.id} className={`transition-transform duration-300 ease-spring hover:rotate-0 hover:-translate-y-1 ${regTilt[i]}`}>
              <Card className="h-full">
                <Badge tone={regTone[r.id]} className="px-4 py-1.5 font-heading text-lg">
                  {r.name}
                </Badge>
                <h3 className="mt-4 text-xl font-bold">{r.plainName}</h3>
                <p className="mt-1.5 text-sm text-ink-muted">{r.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Before / after ---------- */}
      <Section id="before-after" title={t.beforeAfter.title} band>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <Card className="border-dashed border-line-strong bg-transparent shadow-none">
            <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">{t.beforeAfter.before.label}</p>
            <p className="mt-2 font-mono text-5xl font-bold text-ink-muted line-through decoration-fix decoration-4">
              {t.beforeAfter.before.big}
            </p>
            <p className="mt-1 text-lg">{t.beforeAfter.before.unit}</p>
            <ul className="mt-5 space-y-2 text-ink-muted">
              {t.beforeAfter.before.points.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <X className="size-4 shrink-0 text-fix-ink" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
          <Card className="border-brand ring-2 ring-brand">
            <p className="text-sm font-semibold tracking-wide text-ink-muted uppercase">{t.beforeAfter.after.label}</p>
            <p className="mt-2 font-mono text-5xl font-bold">{t.beforeAfter.after.big}</p>
            <p className="mt-1 text-lg">{t.beforeAfter.after.unit}</p>
            <ul className="mt-5 space-y-2">
              {t.beforeAfter.after.points.map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <Check className="size-4 shrink-0 text-pass-ink" aria-hidden />
                  {p}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </Section>

      {/* ---------- Sample report preview ---------- */}
      <Section id="preview" title={t.preview.title}>
        <div className="mt-8 grid items-center gap-10 md:grid-cols-2">
          <div>
            <p className="max-w-md text-lg text-ink-muted">{t.preview.body}</p>
            <ButtonLink href="/sample-report" variant="secondary" className="mt-6">
              {t.preview.cta}
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
          <div className="paper-shadow">
            <div className="zigzag-bottom bg-surface px-6 pt-6">
              <div className="flex items-baseline justify-between gap-4">
                <p className="font-heading text-lg font-bold">{copy.report.docTitle}</p>
                <Badge>{copy.common.sample}</Badge>
              </div>
              <p className="mt-3 flex items-baseline gap-2">
                <span className="tabular font-mono text-5xl font-bold">{score}</span>
                <span className="font-mono text-sm text-ink-muted">/ 100 · {t.preview.scoreLabel}</span>
              </p>
              <ul className="dashed-rule mt-4 space-y-3 pt-4">
                {previewControls.map((c) => (
                  <li key={c.id} className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">{c.plainTitle}</span>
                      <span className="block font-mono text-[11px] text-ink-muted">{c.ref}</span>
                    </span>
                    <StatusPill status={c.status} size="sm" />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* ---------- Security ---------- */}
      <Section id="security" title={t.security.title} band>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {t.security.points.map((p, i) => {
            const Icon = securityIcons[i];
            return (
              <li key={p.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-mint text-on-accent">
                  <Icon className="size-5" aria-hidden />
                </span>
                <div>
                  <h3 className="font-bold">{p.title}</h3>
                  <p className="mt-1 text-sm text-ink-muted">{p.body}</p>
                </div>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* ---------- Testimonials (sample) ---------- */}
      <Section id="quotes" title={t.testimonials.title}>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {t.testimonials.items.map((q) => (
            <li key={q.name}>
              <Card className="flex h-full flex-col">
                <Badge className="self-start">{t.testimonials.sampleLabel}</Badge>
                <blockquote className="mt-4 flex-1 text-lg leading-snug font-medium">“{q.quote}”</blockquote>
                <p className="mt-4 text-sm text-ink-muted">
                  {q.name} · {q.org}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>

      {/* ---------- Final CTA ---------- */}
      <section className="px-5 pb-20">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-8 rounded-card bg-brand px-8 py-12 text-brand-ink md:px-14">
          <div className="max-w-xl">
            <h2 className="text-3xl font-extrabold md:text-4xl">{t.finalCta.title}</h2>
            <p className="mt-2 text-lg">{t.finalCta.body}</p>
            <ButtonLink href="/signup" size="lg" className="mt-6 bg-surface text-ink">
              {copy.common.startTrial}
              <ArrowRight aria-hidden />
            </ButtonLink>
          </div>
          <Stubby mood="party" size={130} className="max-md:hidden" />
        </div>
      </section>
    </>
  );
}
