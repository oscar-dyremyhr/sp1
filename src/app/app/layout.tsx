import type { Metadata } from "next";
import { AppGate } from "@/screens/app/AppGate";

export const metadata: Metadata = { robots: { index: false } };

// The app area renders only in the browser (it reads local storage), so there is
// nothing for the instant-navigation check to validate on the server.
export const instant = false;

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return <AppGate>{children}</AppGate>;
}
