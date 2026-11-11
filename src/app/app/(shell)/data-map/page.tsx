import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { DataMapScreen } from "@/screens/app/DataMap";

export const metadata: Metadata = { title: copy.dataMap.title };

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;

export default function Page() {
  return <DataMapScreen />;
}
