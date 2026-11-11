import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Faq } from "@/screens/marketing/Faq";

export const metadata: Metadata = { title: copy.marketing.nav.faq, description: copy.faqPage.subtitle };

export default function FaqPage() {
  return <Faq />;
}
