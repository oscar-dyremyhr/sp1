"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Download, Eye, Link2, RefreshCw } from "lucide-react";
import { Button, ButtonLink, Confetti, Stubby, toast } from "@/design-system/components";
import { copy } from "@/content/copy";
import { pricing } from "@/content/pricing";
import { isFreeRegenerate } from "@/lib/report";
import { markCelebrated, regenerateReport } from "@/mocks/service";
import type { Report } from "@/mocks/types";
import { useCredits } from "@/store/credits";
import { useReports } from "@/store/reports";
import { openPaywall } from "@/screens/app/Paywall";
import { GenerationOverlay } from "./GenerationOverlay";
import { ReportDocument } from "./ReportDocument";

const t = copy.viewer;

export type ReportMode = "app" | "shared" | "sample";

/** Report toolbar plus the document. "shared" and "sample" are read-only. */
export function ReportView({ report: initial, mode }: { report: Report; mode: ReportMode }) {
  const [report, setReport] = useState(initial);
  const [refreshing, setRefreshing] = useState(false);
  const [celebrate] = useState(() => mode === "app" && useReports.getState().celebrateId === initial.id);
  // Only the app view needs the clock (for the free 24-hour refresh).
  const [now] = useState(() => (mode === "app" ? Date.now() : 0));

  useEffect(() => {
    if (celebrate) markCelebrated();
  }, [celebrate]);

  const copyLink = async () => {
    const url = `${window.location.origin}/share/${report.shareToken}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard blocked: the link is still shown in the toast */
    }
    toast({ title: t.linkCopied, description: mode === "sample" ? url : t.linkCopiedBody });
  };

  const free = isFreeRegenerate(report, now, pricing.freeRegenerateHours);
  const refresh = async () => {
    if (!free && useCredits.getState().credits < 1) {
      openPaywall({ onDone: () => void refresh() });
      return;
    }
    setRefreshing(true);
    try {
      setReport(await regenerateReport(report.id));
      toast({ title: t.refreshed, description: t.refreshedBody });
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div data-testid="report-view" data-mode={mode}>
      {celebrate ? <Confetti /> : null}
      {refreshing ? (
        <GenerationOverlay lines={report.controlSnapshots.map((c) => ({ title: c.plainTitle, status: c.status }))} />
      ) : null}

      {mode === "sample" ? (
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-4 rounded-card bg-sun px-6 py-4 text-on-accent">
          <div>
            <p className="font-heading text-lg font-bold">{t.sampleBanner.title}</p>
            <p className="text-sm">{t.sampleBanner.body}</p>
          </div>
          <ButtonLink href="/signup" className="bg-ink text-paper">
            {t.sampleBanner.cta}
          </ButtonLink>
        </div>
      ) : null}
      {mode === "shared" ? (
        <p className="no-print mb-5 flex items-center gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-sm font-medium" data-testid="shared-banner">
          <Eye className="size-4" aria-hidden />
          {t.sharedBanner}
        </p>
      ) : null}
      {celebrate ? (
        <div className="no-print mb-5 flex items-center gap-4 rounded-card bg-pass-soft px-6 py-4" data-testid="first-report-banner">
          <Stubby mood="party" size={56} />
          <div>
            <p className="font-heading text-lg font-bold">{t.firstReport.title}</p>
            <p className="text-sm text-ink-muted">{t.firstReport.body}</p>
          </div>
        </div>
      ) : null}

      <div className="no-print mb-5 flex flex-wrap items-center gap-3">
        {mode === "app" ? (
          <Link href="/app/reports" className="mr-auto flex items-center gap-1.5 text-sm font-semibold text-ink-muted hover:text-ink">
            <ArrowLeft className="size-4" aria-hidden />
            {t.back}
          </Link>
        ) : (
          <span className="mr-auto" />
        )}
        {mode === "app" ? (
          <Button variant="ghost" icon={<RefreshCw aria-hidden />} onClick={refresh} title={free ? t.refreshFree : t.refreshCost}>
            {t.refresh}
            <span className="rounded-full bg-paper-deep px-2 py-0.5 text-xs font-normal text-ink-muted">
              {free ? t.refreshFree : t.refreshCost}
            </span>
          </Button>
        ) : null}
        {mode !== "shared" ? (
          <Button variant="secondary" icon={<Link2 aria-hidden />} onClick={copyLink} data-testid="copy-share-link">
            {t.copyLink}
          </Button>
        ) : null}
        <Button variant="secondary" icon={<Download aria-hidden />} onClick={() => window.print()} data-testid="download-pdf">
          {t.download}
        </Button>
      </div>

      <div className="rounded-card border border-line bg-surface p-6 shadow-card sm:p-10 print:rounded-none print:border-0 print:p-0 print:shadow-none">
        <ReportDocument report={report} />
      </div>
    </div>
  );
}
