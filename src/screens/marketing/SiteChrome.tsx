"use client";

import Link from "next/link";
import { ButtonLink, Logo, ThemeToggle } from "@/design-system/components";
import { copy } from "@/content/copy";
import { useHydrated } from "@/lib/use-hydrated";
import { useSession } from "@/store/session";

const t = copy.marketing;
const links = [
  { href: "/pricing", label: t.nav.pricing },
  { href: "/sample-report", label: t.nav.sample },
  { href: "/faq", label: t.nav.faq },
];

export function SiteHeader() {
  const hydrated = useHydrated();
  const user = useSession((s) => s.user);
  const signedIn = hydrated && user !== null;
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-5">
        <Logo />
        <nav aria-label={t.nav.main} className="flex flex-1 items-center gap-1 max-md:hidden">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="rounded-full px-3 py-2 text-sm font-medium text-ink-muted hover:bg-ink/6 hover:text-ink">
              {l.label}
            </Link>
          ))}
        </nav>
        <span className="flex-1 md:hidden" />
        <ThemeToggle />
        {signedIn ? (
          <ButtonLink href="/app" size="sm">
            {copy.nav.openApp}
          </ButtonLink>
        ) : (
          <>
            <Link href="/login" className="rounded-full px-3 py-2 text-sm font-medium hover:bg-ink/6 max-sm:hidden">
              {t.nav.logIn}
            </Link>
            <ButtonLink href="/signup" size="sm" data-testid="header-cta">
              {copy.common.startTrial}
            </ButtonLink>
          </>
        )}
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="no-print border-t border-line bg-paper-deep">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-start justify-between gap-6 px-5 py-10">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-2 text-sm text-ink-muted">{copy.brand.tagline}</p>
          <p className="mt-3 text-xs text-ink-muted">{t.footer.demoNote}</p>
        </div>
        <nav aria-label={copy.brand.name} className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {[...links, { href: "/styleguide", label: t.footer.styleguide }, { href: "/login", label: t.nav.logIn }].map((l) => (
            <Link key={l.href} href={l.href} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
