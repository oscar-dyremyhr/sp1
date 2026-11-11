import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Pricing } from "@/screens/marketing/Pricing";

export const metadata: Metadata = { title: copy.marketing.nav.pricing, description: copy.pricingPage.subtitle };

export default function PricingPage() {
  return <Pricing />;
}
