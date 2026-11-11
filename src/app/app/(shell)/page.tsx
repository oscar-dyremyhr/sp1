import type { Metadata } from "next";
import { copy } from "@/content/copy";
import { Dashboard } from "@/screens/app/Dashboard";

export const metadata: Metadata = { title: copy.dashboard.title };

export default function DashboardPage() {
  return <Dashboard />;
}
