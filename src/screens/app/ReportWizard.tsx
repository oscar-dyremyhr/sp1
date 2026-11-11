"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { Badge, Button, Card, ChoiceCard, PageLoading, Stepper, Term } from "@/design-system/components";
import { copy } from "@/content/copy";
import { useQuery } from "@/lib/use-query";
import { generateReport, listControls, listRegulations, listWorkspaces } from "@/mocks/service";
import type { Audience, RegulationId } from "@/mocks/types";
import { useCredits } from "@/store/credits";
import { useReports } from "@/store/reports";
import { GenerationOverlay } from "@/screens/report/GenerationOverlay";
import { ErrorState } from "./ErrorState";
import { openPaywall } from "./Paywall";

const t = copy.wizard;
const audiences: Audience[] = ["auditor", "board", "internal"];
const regTone = { dora: "brand", bcbs239: "mint", gdpr: "sun" } as const;

export function ReportWizard() {
  const router = useRouter();
  const from = useSearchParams().get("from");
  const [source] = useState(() => useReports.getState().reports.find((r) => r.id === from));
  const credits = useCredits((s) => s.credits);

  const [step, setStep] = useState(0);
  const [regulation, setRegulation] = useState<RegulationId | "all">(source?.regulationId ?? "all");
  const [workspaceIds, setWorkspaceIds] = useState<string[] | null>(source?.scope.workspaceIds ?? null);
  const [audience, setAudience] = useState<Audience>(source?.audience ?? "auditor");
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  const options = useQuery("wizard-options", async () => {
    const [regulations, workspaces, controls] = await Promise.all([listRegulations(), listWorkspaces(), listControls()]);
    return { regulations, workspaces, controls };
  });

  if (options.error) return <ErrorState onRetry={options.reload} />;
  if (!options.data) return <PageLoading label={t.loading} />;
  const { regulations, workspaces, controls } = options.data;

  const selected = workspaceIds ?? workspaces.map((w) => w.id);
  const chosen = workspaces.filter((w) => selected.includes(w.id));
  const catalogs = chosen.flatMap((w) => w.catalogs);
  const inScope = controls.filter((c) => regulation === "all" || c.regulationId === regulation);
  const regulationName = regulation === "all" ? t.allName : copy.regulations[regulation];

  const next = () => {
    if (step === 0 && chosen.length === 0) {
      setError(t.needWorkspace);
      return;
    }
    setError("");
    setStep((s) => s + 1);
  };

  const start = async () => {
    setGenerating(true);
    try {
      const report = await generateReport({ regulationId: regulation, scope: { workspaceIds: selected, catalogs }, audience });
      router.push(`/app/reports/${report.id}`);
    } catch (e) {
      setGenerating(false);
      setError(e instanceof Error ? e.message : copy.common.errorBody);
    }
  };

  const generate = () => {
    // Read the live value: credits may have just been bought in the paywall.
    if (useCredits.getState().credits < 1) openPaywall({ onDone: () => void start() });
    else void start();
  };

  return (
    <div className="mx-auto max-w-3xl" data-testid="report-wizard">
      {generating ? <GenerationOverlay lines={inScope.map((c) => ({ title: c.plainTitle, status: c.status }))} /> : null}
      <Stepper steps={t.steps} current={step} />

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
              <div className="space-y-8">
                <fieldset>
                  <legend className="text-2xl font-bold">{t.regulationTitle}</legend>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <ChoiceCard
                      type="radio"
                      name="regulation"
                      value="all"
                      checked={regulation === "all"}
                      onChange={() => setRegulation("all")}
                      title={t.allName}
                      description={t.allDescription}
                    />
                    {regulations.map((r) => (
                      <ChoiceCard
                        key={r.id}
                        type="radio"
                        name="regulation"
                        value={r.id}
                        checked={regulation === r.id}
                        onChange={() => setRegulation(r.id)}
                        title={r.plainName}
                        icon={<Badge tone={regTone[r.id]}>{r.name}</Badge>}
                      />
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="text-2xl font-bold">{t.scopeTitle}</legend>
                  <p className="mt-1 text-sm text-ink-muted">
                    <Term k="workspace" /> · <Term k="catalog" />
                  </p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {workspaces.map((w) => (
                      <ChoiceCard
                        key={w.id}
                        type="checkbox"
                        name="workspaces"
                        value={w.id}
                        checked={selected.includes(w.id)}
                        onChange={(on) => setWorkspaceIds(on ? [...selected, w.id] : selected.filter((id) => id !== w.id))}
                        title={w.name}
                        description={`${t.catalogs(w.catalogs.length)} · ${w.region}`}
                      />
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}

            {step === 1 ? (
              <fieldset>
                <legend className="text-2xl font-bold">{t.audienceTitle}</legend>
                <div className="mt-4 grid gap-3">
                  {audiences.map((a) => (
                    <ChoiceCard
                      key={a}
                      type="radio"
                      name="audience"
                      value={a}
                      checked={audience === a}
                      onChange={() => setAudience(a)}
                      title={copy.audiences[a].name}
                      description={copy.audiences[a].description}
                    />
                  ))}
                </div>
              </fieldset>
            ) : null}

            {step === 2 ? (
              <section aria-labelledby="review-title">
                <h2 id="review-title" className="text-2xl font-bold">
                  {t.reviewTitle}
                </h2>
                <div className="paper-shadow mt-5">
                  <dl className="zigzag-bottom bg-paper-deep px-6 pt-5 font-mono text-sm">
                    {(
                      [
                        [t.rows.regulation, `${regulationName} (${copy.controls.count(inScope.length)})`],
                        [t.rows.scope, t.scopeSummary(chosen.length, catalogs.length)],
                        [t.rows.audience, copy.audiences[audience].name],
                      ] as const
                    ).map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-6 py-1.5">
                        <dt className="text-ink-muted">{label}</dt>
                        <dd className="text-right font-semibold">{value}</dd>
                      </div>
                    ))}
                    <div className="dashed-rule mt-2 flex justify-between gap-6 pt-3 text-base">
                      <dt className="font-bold">{t.rows.cost}</dt>
                      <dd className="font-bold" data-testid="wizard-cost">
                        {t.costOne}
                      </dd>
                    </div>
                  </dl>
                </div>
                <p className="mt-4 text-sm text-ink-muted" data-testid="wizard-credits-note">
                  {credits >= 1 ? t.creditsAfter(credits - 1) : t.noCredits}
                </p>
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
          {step > 0 ? (
            <Button variant="ghost" icon={<ArrowLeft aria-hidden />} onClick={() => setStep((s) => s - 1)}>
              {copy.common.back}
            </Button>
          ) : (
            <span />
          )}
          {step < 2 ? (
            <Button onClick={next}>
              {copy.common.next}
              <ArrowRight aria-hidden />
            </Button>
          ) : (
            <Button onClick={generate} icon={<Sparkles aria-hidden />} data-testid="wizard-generate">
              {t.generate}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
