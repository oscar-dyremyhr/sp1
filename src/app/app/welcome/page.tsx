import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Welcome } from "@/screens/app/Welcome";

export const metadata: Metadata = { title: copy.welcome.subtitle };

export default function WelcomePage() {
  return <Welcome />;
}

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;
