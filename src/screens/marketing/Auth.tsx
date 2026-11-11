"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button, Card, Field, Input, Logo, Stubby, ThemeToggle } from "@/design-system/components";
import { copy } from "@/content/copy";
import { signUp } from "@/mocks/service";
import { useSession } from "@/store/session";

function MicrosoftMark() {
  // Four plain squares in token colours: a hint, not the real logo.
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <rect x="0" y="0" width="7" height="7" fill="var(--status-fix)" />
      <rect x="9" y="0" width="7" height="7" fill="var(--status-pass)" />
      <rect x="0" y="9" width="7" height="7" fill="var(--brand)" />
      <rect x="9" y="9" width="7" height="7" fill="var(--sun)" />
    </svg>
  );
}

export function Auth({ mode }: { mode: "signup" | "login" }) {
  const t = copy.auth[mode];
  const router = useRouter();
  const [busy, setBusy] = useState<"form" | "microsoft" | null>(null);

  const finish = async (input: { name: string; email: string; company: string }, via: "form" | "microsoft") => {
    setBusy(via);
    await signUp(input);
    router.push(useSession.getState().onboarded ? "/app" : "/app/welcome");
  };

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    void finish(
      {
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        company: String(data.get("company") ?? ""),
      },
      "form",
    );
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-6 pb-16 md:grid-cols-2">
        <Card className="p-8">
          <h1 className="text-3xl font-extrabold">{t.title}</h1>
          <p className="mt-1.5 text-ink-muted">{t.subtitle}</p>

          <Button
            variant="secondary"
            className="mt-6 w-full"
            icon={<MicrosoftMark />}
            loading={busy === "microsoft"}
            disabled={busy !== null}
            onClick={() => finish({ name: "Alex Demo", email: "alex.demo@nordlys.example", company: "Nordlys Bank" }, "microsoft")}
          >
            {copy.auth.microsoft}
          </Button>
          <div className="my-5 flex items-center gap-3 text-xs text-ink-muted">
            <span className="h-px flex-1 bg-line" />
            {copy.auth.or}
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            {mode === "signup" ? (
              <Field label={copy.auth.name} htmlFor="name">
                <Input id="name" name="name" autoComplete="name" placeholder={copy.auth.namePlaceholder} />
              </Field>
            ) : null}
            <Field label={copy.auth.email} htmlFor="email">
              <Input id="email" name="email" type="email" autoComplete="email" placeholder={copy.auth.emailPlaceholder} />
            </Field>
            {mode === "signup" ? (
              <Field label={copy.auth.company} htmlFor="company">
                <Input id="company" name="company" autoComplete="organization" placeholder={copy.auth.companyPlaceholder} />
              </Field>
            ) : null}
            <Button type="submit" className="w-full" loading={busy === "form"} disabled={busy !== null}>
              {t.submit}
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-ink-muted">{copy.auth.demoNote}</p>
          <p className="mt-5 text-center text-sm">
            {t.switchText}{" "}
            <Link href={mode === "signup" ? "/login" : "/signup"} className="font-semibold text-brand underline-offset-4 hover:underline">
              {t.switchLink}
            </Link>
          </p>
        </Card>

        <aside className="max-md:hidden">
          <Stubby mood="happy" size={120} />
          <h2 className="mt-6 text-3xl font-extrabold">{copy.auth.asideTitle}</h2>
          <ul className="mt-5 space-y-3">
            {copy.auth.asidePoints.map((p) => (
              <li key={p} className="flex items-center gap-3">
                <span className="flex size-6 items-center justify-center rounded-full bg-mint text-on-accent">
                  <Check className="size-4" aria-hidden />
                </span>
                {p}
              </li>
            ))}
          </ul>
        </aside>
      </main>
    </div>
  );
}
