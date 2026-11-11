import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Billing } from "@/screens/app/Billing";

export const metadata: Metadata = { title: copy.billing.title };

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;

export default function Page() {
  return <Billing />;
}
