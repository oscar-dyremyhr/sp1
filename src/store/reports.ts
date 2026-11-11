import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { Report } from "@/mocks/types";

export type ReportsState = {
  reports: Report[];
  /** Controls a re-scan has found fixed since the first scan. */
  fixedControlIds: string[];
  /** Report that should get confetti when it is first opened. */
  celebrateId: string | null;
};

export const initialReports: ReportsState = { reports: [], fixedControlIds: [], celebrateId: null };

export const useReports = create<ReportsState>()(
  persist(() => initialReports, {
    name: "receipts-reports",
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
);
