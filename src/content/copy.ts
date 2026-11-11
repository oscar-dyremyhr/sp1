/**
 * All user-facing strings live in this one file, so Norwegian and Danish
 * can be added later by swapping the object. UI copy is written for a
 * 12-year-old reading level; only the report itself is formal.
 */
import type { Audience, ControlStatus, EvidenceType, RegulationId, Role } from "@/mocks/types";

const plural = (n: number, one: string, many: string) => (n === 1 ? one : many);

export const copy = {
  brand: {
    name: "Receipts",
    tagline: "Show the auditor your receipts.",
    contactEmail: "hello@receipts.example",
  },
  meta: {
    title: "Receipts — audit evidence in minutes",
    description:
      "Receipts turns your Databricks lakehouse into an auditor-ready evidence report for DORA, BCBS 239 and GDPR. In minutes, not weeks.",
  },
  common: {
    close: "Close",
    dismiss: "Dismiss",
    back: "Back",
    next: "Next",
    cancel: "Cancel",
    continue: "Continue",
    loading: "Loading…",
    notifications: "Notifications",
    sample: "Sample",
    sampleData: "Sample data",
    copied: "Copied",
    comingSoon: "Coming soon",
    all: "All",
    generateAuditReport: "Generate audit report",
    startTrial: "Start free trial",
    skipToContent: "Skip to content",
    tryAgain: "Try again",
    errorTitle: "That didn’t work",
    errorBody: "Something went wrong on our side. Please try again.",
  },
  theme: {
    switchTo: (t: "light" | "dark") => `Switch to ${t} theme`,
  },
  status: {
    pass: "Looks good",
    watch: "Keep an eye on it",
    fix: "Needs fixing",
  } satisfies Record<ControlStatus, string>,
  scoreWords: {
    pass: "Looks good",
    watch: "Nearly there",
    fix: "Needs work",
  } satisfies Record<ControlStatus, string>,
  gauge: {
    outOf: "out of 100",
    aria: (score: number, word: string) => `Readiness score ${score} out of 100. ${word}.`,
  },
  stamp: { verified: "Verified" },
  stepper: {
    aria: "Progress",
    progress: (n: number, total: number) => `Step ${n} of ${total}`,
  },
  credits: {
    left: (n: number) => `${plural(n, "report", "reports")} left`,
  },
  evidenceTypes: {
    lineage: "Lineage",
    dq_check: "Quality check",
    access_grant: "Access rights",
    change_record: "Change history",
    retention_policy: "Retention rule",
    ownership_tag: "Ownership",
  } satisfies Record<EvidenceType, string>,
  regulations: {
    dora: "DORA",
    bcbs239: "BCBS 239",
    gdpr: "GDPR",
  } satisfies Record<RegulationId, string>,
  roles: { owner: "Owner", member: "Member", viewer: "Viewer" } satisfies Record<Role, string>,
  audiences: {
    auditor: { name: "Auditor", description: "Full detail. Every control with the evidence behind it." },
    board: { name: "Board", description: "Short and clear. The score, the summary and what needs attention." },
    internal: { name: "Internal team", description: "Everything, plus who fixes what and how." },
  } satisfies Record<Audience, { name: string; description: string }>,
  // <<sections>>
};
