import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { RegulationId, User } from "@/mocks/types";

export type SessionState = {
  user: User | null;
  orgName: string;
  country: string;
  onboarded: boolean;
  regulations: RegulationId[];
  workspaceUrl: string;
  /** Client ID of the read-only service principal (never the secret). */
  workspaceClientId: string;
  workspaceConnected: boolean;
  lastScanAt: string | null;
  trialEndsAt: string | null;
  team: User[];
};

export const initialSession: SessionState = {
  user: null,
  orgName: "",
  country: "Norway",
  onboarded: false,
  regulations: ["dora", "bcbs239", "gdpr"],
  workspaceUrl: "",
  workspaceClientId: "",
  workspaceConnected: false,
  lastScanAt: null,
  trialEndsAt: null,
  team: [],
};

/** Who is signed in, their company and their team. Kept in local storage. */
export const useSession = create<SessionState>()(
  persist(() => initialSession, {
    name: "receipts-session",
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
);
