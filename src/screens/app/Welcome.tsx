"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Copy, Loader2, Radar, UserPlus } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  ChoiceCard,
  Field,
  Input,
  Logo,
  ScoreGauge,
  Select,
  Stepper,
  Stubby,
  Term,
  ThemeToggle,
  toast,
} from "@/design-system/components";
import { copy } from "@/content/copy";
import {
  allRegulations,
  runScan,
  saveCompanyProfile,
  saveRegulations,
  testWorkspaceConnection,
} from "@/mocks/service";
import type { RegulationId, Workspace } from "@/mocks/types";
import { useSession } from "@/store/session";

const t = copy.welcome;

export function Welcome() {
  const router = useRouter();
  const session = useSession();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const [company, setCompany] = useState(session.orgName);
  const [country, setCountry] = useState(session.country);
  const [regs, setRegs] = useState<RegulationId[]>(session.regulations);
  const [url, setUrl] = useState(session.workspaceUrl);
  const [checksDone, setChecksDone] = useState(-1);
  const [found, setFound] = useState<Workspace[] | null>(null);
  const [scan, setScan] = useState<{ checked: number; total: number } | null>(null);
  const [score, setScore] = useState<number | null>(null);

  // Onboarding was already finished when this page opened (for example after a
  // reload): go to the dashboard. Finishing the scan here must not redirect,
  // so the "Scan finished" step can be seen.
  const [alreadyOnboarded] = useState(() => useSession.getState().onboarded);
  useEffect(() => {
    if (alreadyOnboarded) router.replace("/app");
  }, [alreadyOnboarded, router]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await work();
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.common.errorBody);
    } finally {
      setBusy(false);
    }
  };

  const next = () =>
    run(async () => {
      if (step === 0) await saveCompanyProfile({ company, country });
      if (step === 1) await saveRegulations(regs);
      setStep((s) => s + 1);
    });

  const testConnection = () =>
    run(async () => {
      setChecksDone(-1);
      setFound(null);
      setFound(await testWorkspaceConnection(url, setChecksDone));
    });

  const firstScan = () =>
    run(async () => {
      const result = await runScan((checked, total) => setScan({ checked, total }));
      setScore(result.score);
    });

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(t.connect.inviteLink);
    } catch {
      /* clipboard blocked: the toast still tells the user what to do */
    }
    toast({ title: t.connect.inviteCopied, description: t.connect.inviteCopiedBody });
  };

  const firstName = (session.user?.name ?? "").split(" ")[0] || "there";
  const testing = busy && step === 2;

  return (
    <div className="flex flex-1 flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-5">
        <Logo href="/app/welcome" />
        <ThemeToggle />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-16">
        <div className="flex items-end gap-4">
          <Stubby mood={score !== null ? "party" : "happy"} size={72} />
          <div>
            <h1 className="text-3xl font-extrabold">{t.title(firstName)}</h1>
            <p className="mt-1 text-ink-muted">{t.subtitle}</p>
          </div>
        </div>

        <Stepper steps={t.steps} current={step} className="mt-8" />

        <Card className="mt-6 p-8">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              {step === 0 ? (
                <section aria-labelledby="w-title">
                  <h2 id="w-title" className="text-2xl font-bold">
                    {t.company.title}
                  </h2>
                  <p className="mt-1 text-ink-muted">{t.company.body}</p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label={t.company.name} htmlFor="w-company">
                      <Input id="w-company" value={company} onChange={(e) => setCompany(e.target.value)} />
                    </Field>
                    <Field label={t.company.country} htmlFor="w-country">
                      <Select id="w-country" value={country} onChange={(e) => setCountry(e.target.value)}>
                        {t.company.countries.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </Select>
                    </Field>
                  </div>
                </section>
              ) : null}

              {step === 1 ? (
                <section aria-labelledby="w-title">
                  <h2 id="w-title" className="text-2xl font-bold">
                    {t.regulations.title}
                  </h2>
                  <p className="mt-1 text-ink-muted">{t.regulations.body}</p>
                  <div className="mt-6 grid gap-3">
                    {allRegulations().map((r) => (
                      <ChoiceCard
                        key={r.id}
                        type="checkbox"
                        name="regulations"
                        value={r.id}
                        checked={regs.includes(r.id)}
                        onChange={(on) => setRegs((cur) => (on ? [...cur, r.id] : cur.filter((x) => x !== r.id)))}
                        title={r.plainName}
                        description={r.description}
                        icon={<Badge tone={r.id === "dora" ? "brand" : r.id === "bcbs239" ? "mint" : "sun"}>{r.name}</Badge>}
                      />
                    ))}
                  </div>
                </section>
              ) : null}

              {step === 2 ? (
                <section aria-labelledby="w-title">
                  <h2 id="w-title" className="text-2xl font-bold">
                    {t.connect.title}
                  </h2>
                  <p className="mt-1 text-ink-muted">
                    {t.connect.body} <Term k="workspace" /> · <Term k="databricks" />
                  </p>
                  <div className="mt-6 flex flex-wrap items-end gap-3">
                    <Field label={t.connect.urlLabel} htmlFor="w-url" hint={t.connect.urlHint} className="min-w-64 flex-1">
                      <Input
                        id="w-url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder={t.connect.urlPlaceholder}
                        inputMode="url"
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3">
                    <Button variant="secondary" onClick={testConnection} loading={testing} disabled={found !== null}>
                      {testing ? t.connect.testing : t.connect.test}
                    </Button>
                    {url ? null : (
                      <Button variant="ghost" onClick={() => setUrl(t.connect.demoUrl)}>
                        {t.connect.useDemo}
                      </Button>
                    )}
                  </div>

                  {testing || found ? (
                    <ul className="mt-5 space-y-2" aria-live="polite">
                      {t.connect.checks.map((label, i) => {
                        const done = i <= checksDone || found !== null;
                        return (
                          <li key={label} className="flex items-center gap-3 text-sm">
                            <span
                              className={`flex size-6 items-center justify-center rounded-full ${done ? "bg-mint text-on-accent" : "border border-line-strong text-ink-muted"}`}
                            >
                              {done ? <Check className="size-4" aria-hidden /> : <Loader2 className="size-3.5 animate-spin" aria-hidden />}
                            </span>
                            <span className={done ? "" : "text-ink-muted"}>{label}</span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                  {found ? (
                    <p className="mt-4 rounded-2xl bg-pass-soft px-4 py-3 text-sm font-medium text-pass-ink" data-testid="connected">
                      {t.connect.success(found.length, found.flatMap((w) => w.catalogs).length)}
                    </p>
                  ) : null}

                  <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-line-strong p-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <UserPlus className="mt-0.5 size-5 shrink-0 text-brand" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold">{t.connect.inviteTitle}</p>
                        <p className="text-sm text-ink-muted">{t.connect.inviteBody}</p>
                      </div>
                    </div>
                    <Button variant="secondary" size="sm" icon={<Copy aria-hidden />} onClick={copyInvite}>
                      {t.connect.inviteCopy}
                    </Button>
                  </div>
                </section>
              ) : null}

              {step === 3 ? (
                <section aria-labelledby="w-title" className="text-center">
                  <h2 id="w-title" className="text-2xl font-bold">
                    {score !== null ? t.scan.done : t.scan.title}
                  </h2>
                  {score !== null ? (
                    <>
                      <ScoreGauge score={score} className="mt-4" />
                      <p className="mx-auto mt-2 max-w-md text-ink-muted">{t.scan.doneBody(score)}</p>
                    </>
                  ) : (
                    <>
                      <p className="mx-auto mt-1 max-w-md text-ink-muted">{t.scan.body}</p>
                      <div className="mx-auto mt-6 max-w-sm" aria-live="polite">
                        <div className="h-3 overflow-hidden rounded-full bg-line">
                          <div
                            className="h-full rounded-full bg-mint transition-[width] duration-150"
                            style={{ width: `${scan ? (scan.checked / scan.total) * 100 : 0}%` }}
                          />
                        </div>
                        <p className="mt-2 min-h-5 font-mono text-xs text-ink-muted">
                          {scan ? t.scan.running(scan.checked, scan.total) : ""}
                        </p>
                      </div>
                    </>
                  )}
                </section>
              ) : null}
            </motion.div>
          </AnimatePresence>

          {error ? (
            <p role="alert" className="mt-4 text-sm text-fix-ink">
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3">
            {step > 0 && score === null ? (
              <Button variant="ghost" icon={<ArrowLeft aria-hidden />} onClick={() => setStep((s) => s - 1)} disabled={busy}>
                {copy.common.back}
              </Button>
            ) : (
              <span />
            )}
            {step < 2 ? (
              <Button onClick={next} loading={busy}>
                {copy.common.next}
                <ArrowRight aria-hidden />
              </Button>
            ) : null}
            {step === 2 ? (
              <Button onClick={() => setStep(3)} disabled={!found}>
                {copy.common.next}
                <ArrowRight aria-hidden />
              </Button>
            ) : null}
            {step === 3 && score === null ? (
              <Button onClick={firstScan} loading={busy} icon={<Radar aria-hidden />}>
                {t.scan.run}
              </Button>
            ) : null}
            {step === 3 && score !== null ? (
              <Button onClick={() => router.push("/app")}>
                {t.scan.toDashboard}
                <ArrowRight aria-hidden />
              </Button>
            ) : null}
          </div>
        </Card>
      </main>
    </div>
  );
}
