import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Auth } from "@/screens/marketing/Auth";

export const metadata: Metadata = { title: copy.auth.signup.title };

export default function Page() {
  return <Auth mode="signup" />;
}
