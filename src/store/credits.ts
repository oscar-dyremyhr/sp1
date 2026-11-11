import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Billing } from "@/content/pricing";
import { pricing } from "@/content/pricing";
import type { Invoice, PlanId } from "@/mocks/types";

export type CreditsState = {
  plan: PlanId;
  billing: Billing;
  /** The single currency in the app: 1 report = 1 credit. */
  credits: number;
  invoices: Invoice[];
};

export const initialCredits: CreditsState = {
  plan: "trial",
  billing: "monthly",
  credits: pricing.trialCredits,
  invoices: [],
};

export const useCredits = create<CreditsState>()(
  persist(() => initialCredits, {
    name: "receipts-credits",
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
);
