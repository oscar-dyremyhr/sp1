import type { Metadata } from "next";
import { setupGuide } from "@/content/setup";
import { Setup } from "@/screens/marketing/Setup";

export const metadata: Metadata = { title: setupGuide.title, description: setupGuide.subtitle };

export default function SetupPage() {
  return <Setup />;
}
