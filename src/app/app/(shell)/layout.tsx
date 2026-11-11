import { AppShell } from "@/screens/app/AppShell";

export default function ShellLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

// Browser-only screen (reads local storage): opt out of instant-navigation validation.
export const instant = false;
