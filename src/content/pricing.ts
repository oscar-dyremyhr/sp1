import type { PlanId } from "@/mocks/types";

/**
 * Placeholder prices in EUR, to test with design partners.
 * Every price in the product comes from this file.
 */
export type Billing = "monthly" | "annual";
export type PackId = "single" | "pack5";

export type Plan = {
  id: PlanId;
  name: string;
  /** Monthly price in EUR. null = no monthly fee. */
  monthly: number | null;
  priceFrom?: boolean;
  reportsIncluded: string;
  /** Credits added when the plan starts and at each monthly top-up. */
  monthlyCredits: number;
  seats: number | null;
  extraSeat?: number;
  seatsLabel: string;
  bestFor: string;
  features: string[];
  highlighted?: boolean;
};

export const pricing = {
  currency: "EUR",
  trialDays: 14,
  trialCredits: 1,
  /** Annual billing = pay for 10 months, get 12. */
  annualFreeMonths: 2,
  /** Regenerating the same report within this window is free. */
  freeRegenerateHours: 24,
  testCard: "4242 4242 4242 4242",
  packs: {
    single: { id: "single", name: "One report", credits: 1, price: 390 },
    pack5: { id: "pack5", name: "5-pack", credits: 5, price: 1690 },
  } satisfies Record<PackId, { id: PackId; name: string; credits: number; price: number }>,
  plans: [
    {
      id: "trial",
      name: "Free trial",
      monthly: 0,
      reportsIncluded: "1 report",
      monthlyCredits: 1,
      seats: 2,
      seatsLabel: "2 seats",
      bestFor: "Trying it on one workspace",
      features: ["1 full audit report", "All three regulations", "2 seats", "14 days, no card needed"],
    },
    {
      id: "payg",
      name: "Pay as you go",
      monthly: null,
      reportsIncluded: "Buy reports when you need them",
      monthlyCredits: 0,
      seats: 3,
      seatsLabel: "3 seats",
      bestFor: "One or two audits a year",
      features: ["€390 per report", "€1,690 for a 5-pack", "Credits never expire", "All three regulations", "3 seats"],
    },
    {
      id: "team",
      name: "Team",
      monthly: 990,
      reportsIncluded: "4 reports per month",
      monthlyCredits: 4,
      seats: 10,
      extraSeat: 49,
      seatsLabel: "10 seats, then €49 per extra seat",
      bestFor: "A compliance team reporting quarterly",
      features: [
        "4 reports every month",
        "All three regulations",
        "10 seats, then €49 per extra seat",
        "Free re-runs for 24 hours",
      ],
      highlighted: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      monthly: 2900,
      priceFrom: true,
      reportsIncluded: "Unlimited reports",
      monthlyCredits: 99,
      seats: null,
      seatsLabel: "Unlimited seats, plus SSO",
      bestFor: "Groups with many workspaces and regulators",
      features: [
        "Unlimited reports",
        "Unlimited seats, plus single sign-on",
        "All three regulations",
        "Custom control mappings (coming soon)",
      ],
    },
  ] satisfies Plan[],
};

export function getPlan(id: PlanId): Plan {
  const plan = pricing.plans.find((p) => p.id === id);
  if (!plan) throw new Error(`Unknown plan: ${id}`);
  return plan;
}

/** What a subscription costs per month and per bill, for the chosen billing period. */
export function planPrice(plan: Plan, billing: Billing) {
  const monthly = plan.monthly ?? 0;
  if (billing === "monthly" || monthly === 0) {
    return { perMonth: monthly, billedNow: monthly, yearlySaving: 0 };
  }
  const paidMonths = 12 - pricing.annualFreeMonths;
  const perYear = monthly * paidMonths;
  return {
    perMonth: Math.round(perYear / 12),
    billedNow: perYear,
    yearlySaving: monthly * pricing.annualFreeMonths,
  };
}

/** How much a 5-pack saves compared with five single reports. */
export function packSaving(): number {
  return pricing.packs.single.price * pricing.packs.pack5.credits - pricing.packs.pack5.price;
}
