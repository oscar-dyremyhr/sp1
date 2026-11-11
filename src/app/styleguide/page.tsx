import type { Metadata } from "next";
import { Styleguide } from "@/screens/Styleguide";

export const metadata: Metadata = { title: "Design system" };

export default function StyleguidePage() {
  return <Styleguide />;
}
