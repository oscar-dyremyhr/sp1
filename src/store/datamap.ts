import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { DataMap } from "@/mocks/types";

/** The organisation's saved data map. null = not saved yet (the app shows its first guess). */
export const useDataMap = create<{ map: DataMap | null }>()(
  persist(() => ({ map: null as DataMap | null }), {
    name: "receipts-datamap",
    version: 1,
    storage: createJSONStorage(() => localStorage),
  }),
);
