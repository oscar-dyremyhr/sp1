/**
 * The mock service layer. This is the ONLY file the UI imports for data.
 * Every function is async with a short random delay so loading states are
 * real. A real API can replace this file later without touching the UI.
 *
 * State lives in the browser (local storage, via the stores) and static
 * demo data comes from the typed fixtures.
 */
import { copy } from "@/content/copy";
import { type Billing, type PackId, getPlan, planPrice, pricing } from "@/content/pricing";
import { isTestCard } from "@/lib/card";
import { shortId } from "@/lib/format";
import { buildSnapshot, isFreeRegenerate } from "@/lib/report";
import { countStatuses, readinessScore } from "@/lib/scoring";
import { initialCredits, useCredits } from "@/store/credits";
import { initialReports, useReports } from "@/store/reports";
import { initialSession, useSession } from "@/store/session";
import { controls as controlFixtures, evidence as evidenceFixtures } from "./fixtures/controls";
import { demoOrg, fixOrder, regulations, scoreHistory, workspaces } from "./fixtures/org";
import type {
  Audience,
  Control,
  ControlFilter,
  Evidence,
  Invoice,
  Organization,
  RegulationId,
  Report,
  ReportScope,
  Role,
  StatusCounts,
  User,
  Workspace,
} from "./types";

// ---------- plumbing ----------

export type DemoErrorCode = "out_of_credits" | "card_declined" | "seat_limit" | "not_found" | "invalid";

export class DemoError extends Error {
  constructor(
    public code: DemoErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DemoError";
  }
}

let speed = 1;
/** Tests set this to 0 to skip the fake network delays. */
export function setMockSpeed(value: number) {
  speed = value;
}
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms * speed));
/** 300 to 900 ms, like a real API on a good day. */
const delay = () => wait(300 + Math.random() * 600);

export const REPORT_GENERATION_MS = 6000;
export const SAMPLE_REPORT_ID = "sample";

// ---------- internal helpers ----------

function currentControls(): Control[] {
  const fixed = new Set(useReports.getState().fixedControlIds);
  const active = new Set(useSession.getState().regulations);
  return controlFixtures
    .filter((c) => active.has(c.regulationId))
    .map((c) =>
      fixed.has(c.id)
        ? {
            ...c,
            status: "pass" as const,
            explanation: copy.service.fixedExplanation,
            fixSteps: [],
            logic: { ...c.logic, result: copy.service.fixedExplanation },
          }
        : c,
    );
}

function composeOrg(): Organization {
  const s = useSession.getState();
  const c = useCredits.getState();
  const plan = getPlan(c.plan);
  return {
    id: demoOrg.id,
    name: s.orgName || demoOrg.name,
    country: s.country,
    plan: c.plan,
    credits: c.credits,
    seats: plan.seats ?? 999,
    trialEndsAt: s.trialEndsAt ?? new Date().toISOString(),
  };
}

function addInvoice(description: string, amount: number) {
  const invoice: Invoice = {
    id: `INV-${1040 + useCredits.getState().invoices.length + 1}`,
    date: new Date().toISOString(),
    description,
    amount,
    status: "paid",
  };
  useCredits.setState((s) => ({ invoices: [invoice, ...s.invoices] }));
}

function requireTestCard(cardNumber: string) {
  if (!isTestCard(cardNumber)) throw new DemoError("card_declined", copy.checkout.declined);
}

// ---------- auth (mocked: any email works) ----------

export async function signUp(input: { name: string; email: string; company: string }): Promise<User> {
  await delay();
  const email = input.email.trim() || "you@example.com";
  const user: User = {
    id: shortId("usr"),
    name: input.name.trim() || email.split("@")[0],
    email,
    role: "owner",
  };
  const existing = useSession.getState();
  // Signing in again on the same browser keeps the demo data.
  if (existing.user && existing.user.email === email) return existing.user;
  useSession.setState({
    ...initialSession,
    user,
    orgName: input.company.trim() || demoOrg.name,
    team: [user],
    trialEndsAt: new Date(Date.now() + pricing.trialDays * 86_400_000).toISOString(),
  });
  useCredits.setState(initialCredits);
  useReports.setState(initialReports);
  return user;
}

export async function logIn(input: { email: string }): Promise<User> {
  return signUp({ name: "", email: input.email, company: "" });
}

export async function logOut(): Promise<void> {
  await wait(150);
  useSession.setState({ user: null });
}

// ---------- onboarding ----------

export async function saveCompanyProfile(input: { company: string; country: string }): Promise<void> {
  await delay();
  useSession.setState({ orgName: input.company.trim() || demoOrg.name, country: input.country });
}

export async function saveRegulations(ids: RegulationId[]): Promise<void> {
  await delay();
  if (ids.length === 0) throw new DemoError("invalid", copy.welcome.regulations.pickOne);
  useSession.setState({ regulations: regulations.map((r) => r.id).filter((id) => ids.includes(id)) });
}

/** Fake "testing connection": calls onStep as each check gets its tick. */
export async function testWorkspaceConnection(url: string, onStep: (index: number) => void): Promise<Workspace[]> {
  if (!url.trim()) throw new DemoError("invalid", copy.welcome.connect.urlMissing);
  const steps = copy.welcome.connect.checks.length;
  for (let i = 0; i < steps; i++) {
    await wait(650 + Math.random() * 300);
    onStep(i);
  }
  useSession.setState({ workspaceUrl: url.trim(), workspaceConnected: true });
  return workspaces;
}

/** First scan: calls onProgress with how many controls have been checked. */
export async function runScan(onProgress?: (checked: number, total: number) => void): Promise<{ score: number }> {
  const total = currentControls().length;
  for (let i = 1; i <= total; i++) {
    await wait(110);
    onProgress?.(i, total);
  }
  useSession.setState({ onboarded: true, lastScanAt: new Date().toISOString() });
  return { score: readinessScore(countStatuses(currentControls())) };
}

/** A later re-scan. In the demo, each one finds that the platform team fixed one more thing. */
export async function rescan(): Promise<{ fixed: Control | null; score: number }> {
  await wait(1800);
  const done = new Set(useReports.getState().fixedControlIds);
  const active = currentControls();
  const nextId = fixOrder.find((id) => !done.has(id) && active.some((c) => c.id === id && c.status !== "pass"));
  const fixedBefore = nextId ? (active.find((c) => c.id === nextId) ?? null) : null;
  if (nextId) useReports.setState((s) => ({ fixedControlIds: [...s.fixedControlIds, nextId] }));
  useSession.setState({ lastScanAt: new Date().toISOString() });
  return { fixed: fixedBefore, score: readinessScore(countStatuses(currentControls())) };
}

// ---------- dashboard and controls ----------

export type Dashboard = {
  org: Organization;
  score: number;
  counts: StatusCounts;
  byRegulation: { id: RegulationId; name: string; score: number; counts: StatusCounts }[];
  topFixes: Control[];
  recentReports: Report[];
  trend: { label: string; score: number }[];
  lastScanAt: string | null;
  totalControls: number;
};

export async function getDashboard(): Promise<Dashboard> {
  await delay();
  const list = currentControls();
  const counts = countStatuses(list);
  const score = readinessScore(counts);
  const rank = { fix: 0, watch: 1, pass: 2 };
  return {
    org: composeOrg(),
    score,
    counts,
    byRegulation: regulations
      .filter((r) => list.some((c) => c.regulationId === r.id))
      .map((r) => {
        const c = countStatuses(list.filter((x) => x.regulationId === r.id));
        return { id: r.id, name: r.name, score: readinessScore(c), counts: c };
      }),
    topFixes: [...list]
      .filter((c) => c.status !== "pass")
      .sort((a, b) => rank[a.status] - rank[b.status])
      .slice(0, 3),
    recentReports: useReports.getState().reports.slice(0, 3),
    trend: [...scoreHistory, { label: copy.dashboard.trendNow, score }],
    lastScanAt: useSession.getState().lastScanAt,
    totalControls: list.length,
  };
}

export async function listRegulations() {
  await wait(100);
  const active = new Set(useSession.getState().regulations);
  return regulations.filter((r) => active.has(r.id));
}

/** All three regulations, for onboarding and marketing pages. */
export function allRegulations() {
  return regulations;
}

export async function listControls(filter: ControlFilter = {}): Promise<Control[]> {
  await delay();
  return currentControls().filter(
    (c) =>
      (!filter.regulationId || filter.regulationId === "all" || c.regulationId === filter.regulationId) &&
      (!filter.status || filter.status === "all" || c.status === filter.status),
  );
}

export async function getControl(id: string): Promise<{ control: Control; evidence: Evidence[] }> {
  await delay();
  const control = currentControls().find((c) => c.id === id);
  if (!control) throw new DemoError("not_found", copy.controls.notFound);
  return { control, evidence: evidenceFixtures.filter((e) => control.evidenceIds.includes(e.id)) };
}

export async function listWorkspaces(): Promise<Workspace[]> {
  await delay();
  const s = useSession.getState();
  if (!s.workspaceConnected) return [];
  return workspaces.map((w) => ({ ...w, lastScanAt: s.lastScanAt ?? w.lastScanAt }));
}

// ---------- reports ----------

export type ReportInput = { regulationId: RegulationId | "all"; scope: ReportScope; audience: Audience };

function makeReport(input: ReportInput, id = shortId("rpt")): Report {
  const s = useSession.getState();
  return {
    id,
    regulationId: input.regulationId,
    scope: input.scope,
    audience: input.audience,
    createdAt: new Date().toISOString(),
    createdBy: s.user?.name ?? demoOrg.name,
    orgName: s.orgName || demoOrg.name,
    shareToken: shortId("share") + shortId(""),
    ...buildSnapshot(input.regulationId, currentControls(), evidenceFixtures),
  };
}

/** Takes about 6 seconds, costs 1 credit, and returns a frozen snapshot of the controls. */
export async function generateReport(input: ReportInput): Promise<Report> {
  if (useCredits.getState().credits < 1) throw new DemoError("out_of_credits", copy.paywall.title);
  await wait(REPORT_GENERATION_MS);
  const report = makeReport(input);
  const first = useReports.getState().reports.length === 0;
  useCredits.setState((s) => ({ credits: s.credits - 1 }));
  useReports.setState((s) => ({
    reports: [report, ...s.reports],
    celebrateId: first ? report.id : s.celebrateId,
  }));
  return report;
}

/** Refreshes a report in place. Free for 24 hours after it was first made, then 1 credit. */
export async function regenerateReport(id: string): Promise<Report> {
  const existing = useReports.getState().reports.find((r) => r.id === id);
  if (!existing) throw new DemoError("not_found", copy.viewer.notFound.title);
  const free = isFreeRegenerate(existing, Date.now(), pricing.freeRegenerateHours);
  if (!free && useCredits.getState().credits < 1) throw new DemoError("out_of_credits", copy.paywall.title);
  await wait(REPORT_GENERATION_MS);
  const refreshed: Report = {
    ...makeReport({ regulationId: existing.regulationId, scope: existing.scope, audience: existing.audience }, id),
    createdAt: existing.createdAt,
    shareToken: existing.shareToken,
  };
  if (!free) useCredits.setState((s) => ({ credits: s.credits - 1 }));
  useReports.setState((s) => ({ reports: s.reports.map((r) => (r.id === id ? refreshed : r)) }));
  return refreshed;
}

export async function listReports(): Promise<Report[]> {
  await delay();
  return useReports.getState().reports;
}

export function sampleReport(): Report {
  return {
    id: SAMPLE_REPORT_ID,
    regulationId: "all",
    scope: { workspaceIds: workspaces.map((w) => w.id), catalogs: workspaces.flatMap((w) => w.catalogs) },
    audience: "auditor",
    createdAt: "2026-11-10T06:30:00Z",
    createdBy: "Ingrid Solberg",
    orgName: demoOrg.name,
    shareToken: "sample",
    ...buildSnapshot("all", controlFixtures, evidenceFixtures),
  };
}

export async function getReport(id: string): Promise<Report> {
  await delay();
  if (id === SAMPLE_REPORT_ID) return sampleReport();
  const report = useReports.getState().reports.find((r) => r.id === id);
  if (!report) throw new DemoError("not_found", copy.viewer.notFound.title);
  return report;
}

export async function getReportByShareToken(token: string): Promise<Report> {
  await delay();
  if (token === "sample") return sampleReport();
  const report = useReports.getState().reports.find((r) => r.shareToken === token);
  if (!report) throw new DemoError("not_found", copy.viewer.notFound.title);
  return report;
}

/** Called once the viewer has shown the first-report confetti. */
export function markCelebrated() {
  useReports.setState({ celebrateId: null });
}

// ---------- billing and credits ----------

export type BillingInfo = {
  org: Organization;
  billing: Billing;
  invoices: Invoice[];
  usage: { label: string; reports: number }[];
  reportsThisMonth: number;
};

export async function getBilling(): Promise<BillingInfo> {
  await delay();
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, i) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (5 - i), 1)));
  const reports = useReports.getState().reports;
  const usage = months.map((m) => ({
    label: m.toLocaleString("en-GB", { month: "short", timeZone: "UTC" }),
    reports: reports.filter((r) => {
      const d = new Date(r.createdAt);
      return d.getUTCFullYear() === m.getUTCFullYear() && d.getUTCMonth() === m.getUTCMonth();
    }).length,
  }));
  return {
    org: composeOrg(),
    billing: useCredits.getState().billing,
    invoices: useCredits.getState().invoices,
    usage,
    reportsThisMonth: usage[usage.length - 1].reports,
  };
}

/** Mocked checkout: only the test card works. Credits never expire. */
export async function buyCredits(packId: PackId, cardNumber: string): Promise<{ credits: number; added: number }> {
  await wait(900);
  requireTestCard(cardNumber);
  const pack = pricing.packs[packId];
  useCredits.setState((s) => ({
    credits: s.credits + pack.credits,
    plan: s.plan === "trial" ? "payg" : s.plan,
  }));
  addInvoice(copy.billing.invoiceLines[packId], pack.price);
  return { credits: useCredits.getState().credits, added: pack.credits };
}

export async function startPlan(
  planId: "team",
  billing: Billing,
  cardNumber: string,
): Promise<{ credits: number; added: number }> {
  await wait(900);
  requireTestCard(cardNumber);
  const plan = getPlan(planId);
  useCredits.setState((s) => ({ plan: planId, billing, credits: s.credits + plan.monthlyCredits }));
  addInvoice(copy.billing.invoiceLines.plan(plan.name, billing), planPrice(plan, billing).billedNow);
  return { credits: useCredits.getState().credits, added: plan.monthlyCredits };
}

// ---------- team and settings ----------

export async function listTeam(): Promise<{ members: User[]; seats: number }> {
  await delay();
  return { members: useSession.getState().team, seats: composeOrg().seats };
}

export async function inviteTeammate(email: string, role: Role): Promise<User> {
  await delay();
  const clean = email.trim();
  if (!clean.includes("@")) throw new DemoError("invalid", copy.settings.team.emailInvalid);
  const { team } = useSession.getState();
  if (team.some((m) => m.email.toLowerCase() === clean.toLowerCase())) {
    throw new DemoError("invalid", copy.settings.team.alreadyThere);
  }
  if (team.length >= composeOrg().seats) throw new DemoError("seat_limit", copy.settings.team.seatLimit);
  const name = clean
    .split("@")[0]
    .split(/[._-]/)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
  const member: User = { id: shortId("usr"), name, email: clean, role };
  useSession.setState((s) => ({ team: [...s.team, member] }));
  return member;
}

export async function removeTeammate(id: string): Promise<void> {
  await delay();
  useSession.setState((s) => ({ team: s.team.filter((m) => m.id !== id || m.role === "owner") }));
}

/** Returns the app to a fresh trial for the signed-in user. */
export async function resetDemo(): Promise<void> {
  await wait(400);
  const { user, orgName } = useSession.getState();
  useSession.setState({
    ...initialSession,
    user,
    orgName,
    team: user ? [user] : [],
    trialEndsAt: new Date(Date.now() + pricing.trialDays * 86_400_000).toISOString(),
  });
  useCredits.setState(initialCredits);
  useReports.setState(initialReports);
}
