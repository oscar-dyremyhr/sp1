import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Settings } from "@/screens/app/Settings";

export const metadata: Metadata = { title: copy.settings.title };

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;

export default function Page() {
  return <Settings />;
}
