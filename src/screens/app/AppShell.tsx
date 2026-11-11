"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { DropdownMenu } from "radix-ui";
import { CreditCard, FileText, LayoutDashboard, ListChecks, LogOut, Settings, Sparkles } from "lucide-react";
import { Button, CreditCounter, Logo, LogoMark, ThemeToggle } from "@/design-system/components";
import { copy } from "@/content/copy";
import { logOut } from "@/mocks/service";
import { useCredits } from "@/store/credits";
import { useSession } from "@/store/session";
import { cn } from "@/lib/utils";
import { FullPageLoading } from "./AppGate";
import { openPaywall, PaywallHost } from "./Paywall";

const nav = [
  { href: "/app", label: copy.nav.dashboard, icon: LayoutDashboard, exact: true },
  { href: "/app/controls", label: copy.nav.controls, icon: ListChecks },
  { href: "/app/reports", label: copy.nav.reports, icon: FileText },
  { href: "/app/billing", label: copy.nav.billing, icon: CreditCard },
  { href: "/app/settings", label: copy.nav.settings, icon: Settings },
];

const titles: [prefix: string, title: string][] = [
  ["/app/controls", copy.controls.title],
  ["/app/reports/new", copy.wizard.title],
  ["/app/reports", copy.reports.title],
  ["/app/billing", copy.billing.title],
  ["/app/settings", copy.settings.title],
  ["/app", copy.dashboard.title],
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useSession((s) => s.user);
  const onboarded = useSession((s) => s.onboarded);
  const trialEndsAt = useSession((s) => s.trialEndsAt);
  const credits = useCredits((s) => s.credits);
  const plan = useCredits((s) => s.plan);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    if (!onboarded) router.replace("/app/welcome");
  }, [onboarded, router]);

  if (!onboarded || !user) return <FullPageLoading />;

  const title = titles.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? copy.dashboard.title;
  const inWizard = pathname.startsWith("/app/reports/new");
  const trialDays = trialEndsAt ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - now) / 86_400_000)) : 0;

  const generate = () => {
    if (credits < 1) openPaywall({ onDone: () => router.push("/app/reports/new") });
    else router.push("/app/reports/new");
  };

  return (
    <div className="flex min-h-dvh flex-1">
      <a
        href="#main"
        className="no-print sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-full focus:bg-surface focus:px-4 focus:py-2"
      >
        {copy.common.skipToContent}
      </a>
      <aside className="no-print sticky top-0 flex h-dvh w-16 shrink-0 flex-col border-r border-line bg-surface lg:w-60">
        <div className="flex h-16 items-center px-4 lg:px-5">
          <Logo href="/app" className="max-lg:hidden" />
          <Link href="/app" aria-label={copy.brand.name} className="lg:hidden">
            <LogoMark size={32} />
          </Link>
        </div>
        <nav aria-label={copy.nav.main} className="flex-1 space-y-1 px-2 py-3 lg:px-3">
          {nav.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                title={item.label}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors max-lg:justify-center",
                  active ? "bg-brand-soft text-ink" : "text-ink-muted hover:bg-ink/6 hover:text-ink",
                )}
              >
                <item.icon className={cn("size-5 shrink-0", active && "text-brand")} aria-hidden />
                <span className="max-lg:sr-only">{item.label}</span>
              </Link>
            );
          })}
        </nav>
        {plan === "trial" ? (
          <p className="mx-3 mb-4 rounded-xl bg-sun px-3 py-2 text-center text-xs font-semibold text-on-accent max-lg:hidden">
            {copy.nav.trialLeft(trialDays)}
          </p>
        ) : null}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="no-print sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-5 backdrop-blur lg:px-8">
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold">{title}</h1>
          <Link href="/app/billing" className="rounded-full" data-testid="credits-link">
            <CreditCounter credits={credits} />
          </Link>
          <ThemeToggle />
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              aria-label={copy.nav.account}
              className="flex size-9 items-center justify-center rounded-full bg-mint font-heading text-sm font-bold text-on-accent"
            >
              {user.name.charAt(0).toUpperCase()}
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="z-50 min-w-56 rounded-2xl border border-line bg-surface p-2 shadow-pop data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold">{user.name}</p>
                  <p className="text-xs text-ink-muted">{user.email}</p>
                </div>
                <DropdownMenu.Separator className="my-1 h-px bg-line" />
                <DropdownMenu.Item
                  onSelect={async () => {
                    await logOut();
                    router.push("/");
                  }}
                  className="flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-sm outline-none data-[highlighted]:bg-ink/6"
                >
                  <LogOut className="size-4" aria-hidden />
                  {copy.nav.logOut}
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {inWizard ? null : (
            <Button onClick={generate} icon={<Sparkles aria-hidden />} data-testid="generate-top">
              {copy.common.generateAuditReport}
            </Button>
          )}
        </header>
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-5 py-8 lg:px-8 print:max-w-none print:p-0">
          {children}
        </main>
      </div>
      <PaywallHost />
    </div>
  );
}
