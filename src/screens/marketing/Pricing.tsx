"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Accordion, Badge, ButtonLink, Card, PlanCard, Segmented, buttonClass } from "@/design-system/components";
import { copy } from "@/content/copy";
import { type Billing, type Plan, planPrice, pricing } from "@/content/pricing";
import { formatEuro } from "@/lib/format";

const t = copy.pricingPage;

function priceFor(plan: Plan, billing: Billing) {
  if (plan.id === "trial") return { price: formatEuro(0), period: t.forDays(pricing.trialDays), note: undefined };
  if (plan.id === "payg") {
    return {
      price: formatEuro(pricing.packs.single.price),
      period: t.perReport,
      note: t.packNote(formatEuro(pricing.packs.pack5.price)),
    };
  }
  const p = planPrice(plan, billing);
  return {
    price: formatEuro(p.perMonth),
    prefix: plan.priceFrom ? t.from : undefined,
    period: t.perMonth,
    note: billing === "annual" ? t.billedYearly(formatEuro(p.billedNow), formatEuro(p.yearlySaving)) : undefined,
  };
}

export function Pricing() {
  const [billing, setBilling] = useState<Billing>("monthly");
  return (
    <div className="mx-auto w-full max-w-6xl px-5 py-14">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-extrabold md:text-5xl">{t.title}</h1>
        <p className="mt-4 text-lg text-ink-muted">{t.subtitle}</p>
        <div className="mt-8 flex justify-center">
          <Segmented
            label={t.billingLabel}
            value={billing}
            onChange={setBilling}
            options={[
              { value: "monthly", label: t.monthly },
              {
                value: "annual",
                label: (
                  <>
                    {t.annual}
                    <Badge tone="mint">{t.annualBadge}</Badge>
                  </>
                ),
              },
            ]}
          />
        </div>
      </header>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4" data-testid="plans" data-billing={billing}>
        {pricing.plans.map((plan) => {
          const p = priceFor(plan, billing);
          return (
            <PlanCard
              key={plan.id}
              name={plan.name}
              bestFor={plan.bestFor}
              price={p.price}
              pricePrefix={"prefix" in p ? p.prefix : undefined}
              period={p.period}
              note={p.note}
              features={plan.features}
              highlighted={plan.highlighted}
              badge={plan.highlighted ? t.mostPopular : undefined}
              action={
                <div className="space-y-2">
                  <ButtonLink href="/signup" variant={plan.highlighted ? "primary" : "secondary"} className="w-full">
                    {copy.common.startTrial}
                  </ButtonLink>
                  {plan.id === "enterprise" ? (
                    <a href={`mailto:${copy.brand.contactEmail}`} className={buttonClass({ variant: "ghost", size: "sm", className: "w-full" })}>
                      {t.contact}
                    </a>
                  ) : null}
                </div>
              }
            />
          );
        })}
      </div>

      <Card className="mt-12 grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">{t.explainer.title}</h2>
          <p className="mt-2 text-ink-muted">{t.explainer.body}</p>
        </div>
        <ul className="space-y-2.5">
          {t.explainer.points.map((point) => (
            <li key={point} className="flex gap-2.5">
              <Check className="mt-1 size-4 shrink-0 text-pass-ink" aria-hidden />
              {point}
            </li>
          ))}
        </ul>
      </Card>

      <section aria-labelledby="pricing-faq" className="mx-auto mt-14 max-w-3xl">
        <h2 id="pricing-faq" className="mb-5 text-2xl font-bold">
          {t.faqTitle}
        </h2>
        <Accordion items={t.faq} />
      </section>
    </div>
  );
}
