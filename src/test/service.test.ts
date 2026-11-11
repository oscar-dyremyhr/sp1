import { beforeEach, describe, expect, it } from "vitest";
import {
  DemoError,
  buyCredits,
  generateReport,
  getDashboard,
  getReport,
  inviteTeammate,
  listControls,
  regenerateReport,
  rescan,
  resetDemo,
  setMockSpeed,
  signUp,
  startPlan,
} from "@/mocks/service";
import { useCredits } from "@/store/credits";
import { useReports } from "@/store/reports";
import { useSession } from "@/store/session";

const input = {
  regulationId: "all" as const,
  scope: { workspaceIds: ["ws-prod"], catalogs: ["risk"] },
  audience: "auditor" as const,
};

beforeEach(async () => {
  setMockSpeed(0);
  await signUp({ name: "Ingrid", email: `ingrid+${Math.random()}@nordlys.example`, company: "Nordlys Bank" });
});

describe("trial journey", () => {
  it("starts with one free credit and a score of 72", async () => {
    expect(useCredits.getState()).toMatchObject({ plan: "trial", credits: 1 });
    const d = await getDashboard();
    expect(d.score).toBe(72);
    expect(d.counts).toEqual({ pass: 15, watch: 6, fix: 3 });
    expect(d.topFixes.map((c) => c.status)).toEqual(["fix", "fix", "fix"]);
  });

  it("spends the credit on the first report, then hits the paywall", async () => {
    const report = await generateReport(input);
    expect(report.score).toBe(72);
    expect(useCredits.getState().credits).toBe(0);
    expect(useReports.getState().celebrateId).toBe(report.id);
    await expect(generateReport(input)).rejects.toMatchObject({ code: "out_of_credits" });
    // The finished report is still there.
    expect((await getReport(report.id)).id).toBe(report.id);
  });

  it("only takes the test card, then adds credits", async () => {
    await expect(buyCredits("single", "4111 1111 1111 1111")).rejects.toBeInstanceOf(DemoError);
    expect(useCredits.getState().credits).toBe(1);
    await buyCredits("pack5", "4242 4242 4242 4242");
    expect(useCredits.getState()).toMatchObject({ plan: "payg", credits: 6 });
    expect(useCredits.getState().invoices[0]).toMatchObject({ amount: 1690, status: "paid" });
  });

  it("tops up 4 credits when the Team plan starts", async () => {
    await startPlan("team", "annual", "4242 4242 4242 4242");
    expect(useCredits.getState()).toMatchObject({ plan: "team", credits: 5, billing: "annual" });
    expect(useCredits.getState().invoices[0].amount).toBe(9900);
  });

  it("regenerates for free within 24 hours", async () => {
    const report = await generateReport(input);
    const again = await regenerateReport(report.id);
    expect(again.id).toBe(report.id);
    expect(useCredits.getState().credits).toBe(0);
  });

  it("keeps old reports frozen when a re-scan finds a fix", async () => {
    const before = await generateReport(input);
    const result = await rescan();
    expect(result.fixed?.id).toBe("dora-a9-02");
    expect(result.score).toBeGreaterThan(72);
    expect((await getReport(before.id)).score).toBe(72);
    expect((await listControls({ status: "fix" })).length).toBe(2);
  });

  it("limits invites to the plan's seats", async () => {
    await inviteTeammate("lars.berg@nordlys.example", "member");
    await expect(inviteTeammate("mia@nordlys.example", "viewer")).rejects.toMatchObject({ code: "seat_limit" });
    expect(useSession.getState().team.map((m) => m.name)).toContain("Lars Berg");
  });

  it("resets to a fresh trial", async () => {
    await generateReport(input);
    await resetDemo();
    expect(useCredits.getState().credits).toBe(1);
    expect(useReports.getState().reports).toHaveLength(0);
    expect(useSession.getState().onboarded).toBe(false);
    expect(useSession.getState().user).not.toBeNull();
  });
});
