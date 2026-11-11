"use client";

import { useState, type FormEvent } from "react";
import { create } from "zustand";
import { ArrowLeft, ArrowRight, CreditCard, Lock } from "lucide-react";
import { Button, Confetti, Field, Input, Modal, Segmented, Stubby } from "@/design-system/components";
import { copy } from "@/content/copy";
import { type Billing, type PackId, getPlan, packSaving, planPrice, pricing } from "@/content/pricing";
import { formatCardNumber } from "@/lib/card";
import { formatEuro } from "@/lib/format";
import { buyCredits, startPlan } from "@/mocks/service";
import { useCredits } from "@/store/credits";
import { cn } from "@/lib/utils";

export type CheckoutItem = { kind: "pack"; packId: PackId } | { kind: "plan"; planId: "team" };

type PaywallState = {
  open: boolean;
  /** "choices" = the friendly three-option paywall; otherwise straight to checkout. */
  view: "choices" | "checkout";
  item: CheckoutItem | null;
  fromChoices: boolean;
  onDone?: () => void;
};

const closed: PaywallState = { open: false, view: "choices", item: null, fromChoices: false, onDone: undefined };
const usePaywall = create<PaywallState>(() => closed);

/** Friendly paywall: shown when someone with zero credits asks for a report. Never an error. */
export function openPaywall(opts: { onDone?: () => void } = {}) {
  usePaywall.setState({ open: true, view: "choices", item: null, fromChoices: true, onDone: opts.onDone });
}

/** Straight to the mocked checkout, for the billing page. */
export function openCheckout(item: CheckoutItem, opts: { onDone?: () => void } = {}) {
  usePaywall.setState({ open: true, view: "checkout", item, fromChoices: false, onDone: opts.onDone });
}

const p = copy.paywall;
const c = copy.checkout;

function Option({
  title,
  body,
  price,
  unit,
  highlighted,
  onClick,
  testId,
}: {
  title: string;
  body: string;
  price: string;
  unit: string;
  highlighted?: boolean;
  onClick: () => void;
  testId: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className={cn(
        "group flex w-full items-center gap-4 rounded-2xl border bg-surface p-4 text-left transition-transform duration-200 ease-spring hover:-translate-y-0.5",
        highlighted ? "border-brand ring-1 ring-brand" : "border-line-strong",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{title}</span>
        <span className="block text-sm text-ink-muted">{body}</span>
      </span>
      <span className="text-right">
        <span className="tabular block font-mono text-xl font-bold">{price}</span>
        <span className="block text-xs text-ink-muted">{unit}</span>
      </span>
      <ArrowRight className="size-5 shrink-0 text-ink-muted transition-transform group-hover:translate-x-1" aria-hidden />
    </button>
  );
}

function Checkout({ item, onBack, onPaid }: { item: CheckoutItem; onBack?: () => void; onPaid: (added: number, total: number) => void }) {
  const [billing, setBilling] = useState<Billing>("monthly");
  const [card, setCard] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const plan = item.kind === "plan" ? getPlan(item.planId) : null;
  const price = plan ? planPrice(plan, billing) : null;
  const amount = item.kind === "pack" ? pricing.packs[item.packId].price : (price?.billedNow ?? 0);
  const label = item.kind === "pack" ? copy.billing.invoiceLines[item.packId] : c.planLine(plan?.name ?? "");

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = item.kind === "pack" ? await buyCredits(item.packId, card) : await startPlan(item.planId, billing, card);
      onPaid(result.added, result.credits);
    } catch (err) {
      setError(err instanceof Error ? err.message : copy.common.errorBody);
    } finally {
      setBusy(false);
    }
  };

  const fillTest = () => {
    setCard(pricing.testCard);
    setExpiry("12 / 29");
    setCvc("123");
    setName("Test Card");
    setError("");
  };

  return (
    <form onSubmit={submit} className="space-y-4" data-testid="checkout">
      <div className="paper-shadow">
        <div className="zigzag-bottom bg-paper-deep px-5 pt-4 font-mono text-sm">
          <p className="text-xs tracking-wide text-ink-muted uppercase">{c.youAreBuying}</p>
          <p className="mt-1 flex items-baseline justify-between gap-4">
            <span className="font-semibold">{label}</span>
            <span className="tabular text-lg font-bold" data-testid="checkout-amount">
              {formatEuro(amount)}
            </span>
          </p>
          {plan ? <p className="text-xs text-ink-muted">{billing === "annual" ? c.billedYearly : c.billedMonthly}</p> : null}
        </div>
      </div>

      {plan && price ? (
        <div className="flex flex-wrap items-center gap-3">
          <Segmented
            label={c.billingPeriod}
            value={billing}
            onChange={setBilling}
            options={[
              { value: "monthly", label: c.monthly },
              { value: "annual", label: c.annual },
            ]}
          />
          <span className="text-sm font-medium text-pass-ink">
            {c.annualSave(formatEuro(planPrice(plan, "annual").yearlySaving))}
          </span>
        </div>
      ) : null}

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 rounded-2xl bg-brand-soft px-4 py-3 text-sm">
        <Lock className="size-4 shrink-0" aria-hidden />
        <span>
          {c.demoNote} {c.testCardHint}
        </span>
        <button type="button" onClick={fillTest} className="font-semibold text-ink underline underline-offset-4" data-testid="fill-test-card">
          {c.useTest}
        </button>
      </p>

      <Field label={c.card} htmlFor="co-card" error={error || undefined}>
        <Input
          id="co-card"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder={pricing.testCard}
          value={card}
          aria-invalid={error ? true : undefined}
          onChange={(e) => setCard(formatCardNumber(e.target.value))}
          className="font-mono"
          required
        />
      </Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label={c.expiry} htmlFor="co-exp">
          <Input id="co-exp" placeholder="12 / 29" autoComplete="cc-exp" value={expiry} onChange={(e) => setExpiry(e.target.value)} className="font-mono" />
        </Field>
        <Field label={c.cvc} htmlFor="co-cvc">
          <Input id="co-cvc" placeholder="123" autoComplete="cc-csc" inputMode="numeric" value={cvc} onChange={(e) => setCvc(e.target.value)} className="font-mono" />
        </Field>
      </div>
      <Field label={c.name} htmlFor="co-name">
        <Input id="co-name" autoComplete="cc-name" value={name} onChange={(e) => setName(e.target.value)} />
      </Field>

      <div className="flex items-center justify-between gap-3 pt-2">
        {onBack ? (
          <Button variant="ghost" icon={<ArrowLeft aria-hidden />} onClick={onBack} disabled={busy}>
            {copy.common.back}
          </Button>
        ) : (
          <span />
        )}
        <Button type="submit" loading={busy} icon={<CreditCard aria-hidden />} data-testid="pay">
          {c.pay(formatEuro(amount))}
        </Button>
      </div>
    </form>
  );
}

/** Mounted once in the app shell. Hosts the paywall, the checkout and the success moment. */
export function PaywallHost() {
  const state = usePaywall();
  const plan = useCredits((s) => s.plan);
  const [paid, setPaid] = useState<{ added: number; total: number } | null>(null);
  const team = getPlan("team");

  const close = () => {
    usePaywall.setState(closed);
    setPaid(null);
  };
  const finish = () => {
    const done = state.onDone;
    close();
    done?.();
  };
  const choose = (item: CheckoutItem) => usePaywall.setState({ view: "checkout", item });

  const title = paid ? c.successTitle : state.view === "checkout" ? c.title : plan === "trial" ? p.title : p.titlePaid;
  const description = paid || state.view === "checkout" ? undefined : p.body;

  return (
    <>
      {paid ? <Confetti /> : null}
      <Modal open={state.open} onOpenChange={(open) => !open && close()} title={title} description={description}>
        {paid ? (
          <div className="text-center" data-testid="checkout-success">
            <Stubby mood="party" size={88} className="mx-auto" />
            <p className="mt-3 text-lg">{c.successBody(paid.added, paid.total)}</p>
            <Button className="mt-5" onClick={finish} data-testid="checkout-continue">
              {copy.common.continue}
              <ArrowRight aria-hidden />
            </Button>
          </div>
        ) : state.view === "checkout" && state.item ? (
          <Checkout
            key={JSON.stringify(state.item)}
            item={state.item}
            onBack={state.fromChoices ? () => usePaywall.setState({ view: "choices", item: null }) : undefined}
            onPaid={(added, total) => setPaid({ added, total })}
          />
        ) : (
          <div className="space-y-3" data-testid="paywall">
            <Option
              testId="paywall-single"
              title={p.single.title}
              body={p.single.body}
              price={formatEuro(pricing.packs.single.price)}
              unit={p.perReport}
              onClick={() => choose({ kind: "pack", packId: "single" })}
            />
            <Option
              testId="paywall-pack5"
              title={p.pack5.title}
              body={p.pack5.body(formatEuro(packSaving()))}
              price={formatEuro(pricing.packs.pack5.price)}
              unit={`${formatEuro(Math.round(pricing.packs.pack5.price / pricing.packs.pack5.credits))} ${p.perReport}`}
              highlighted
              onClick={() => choose({ kind: "pack", packId: "pack5" })}
            />
            <Option
              testId="paywall-plan"
              title={p.plan.title}
              body={p.plan.body}
              price={formatEuro(team.monthly ?? 0)}
              unit={p.perMonth}
              onClick={() => choose({ kind: "plan", planId: "team" })}
            />
            <div className="pt-2 text-center">
              <Button variant="ghost" onClick={close}>
                {p.notNow}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
