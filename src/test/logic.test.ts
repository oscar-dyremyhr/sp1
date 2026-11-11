import { describe, expect, it } from "vitest";
import { getPlan, packSaving, planPrice, pricing } from "@/content/pricing";
import { glossaryPattern, lookupTerm } from "@/content/glossary";
import { formatCardNumber, isTestCard } from "@/lib/card";
import { buildSnapshot, compareReports, isFreeRegenerate } from "@/lib/report";
import { countStatuses, readinessScore, scoreBand } from "@/lib/scoring";
import { controls, evidence } from "@/mocks/fixtures/controls";
import { workspaces } from "@/mocks/fixtures/org";
import type { Report } from "@/mocks/types";

describe("Nordlys Bank fixtures", () => {
  it("has 24 controls: DORA 10, BCBS 239 8, GDPR 6", () => {
    expect(controls).toHaveLength(24);
    const by = (id: string) => controls.filter((c) => c.regulationId === id).length;
    expect([by("dora"), by("bcbs239"), by("gdpr")]).toEqual([10, 8, 6]);
  });

  it("is seeded to 15 pass, 6 watch, 3 fix and a score of 72", () => {
    const counts = countStatuses(controls);
    expect(counts).toEqual({ pass: 15, watch: 6, fix: 3 });
    expect(readinessScore(counts)).toBe(72);
  });

  it("has 2 workspaces and 14 catalogs", () => {
    expect(workspaces).toHaveLength(2);
    expect(workspaces.flatMap((w) => w.catalogs)).toHaveLength(14);
  });

  it("gives every control evidence, and fix steps unless it passes", () => {
    const ids = new Set(evidence.map((e) => e.id));
    for (const c of controls) {
      expect(c.evidenceIds.length).toBeGreaterThan(0);
      expect(c.evidenceIds.every((id) => ids.has(id))).toBe(true);
      if (c.status !== "pass") expect(c.fixSteps.length).toBeGreaterThan(0);
    }
  });
});

describe("how we got each answer", () => {
  it("gives every control a rule and a result", () => {
    for (const c of controls) {
      expect(c.logic?.rule, c.id).toBeTruthy();
      expect(c.logic?.result, c.id).toBeTruthy();
    }
  });

  it("gives every piece of evidence a query, columns and a reading", () => {
    for (const e of evidence) {
      expect(e.method, e.id).toBeDefined();
      expect(e.method.query.length, e.id).toBeGreaterThan(20);
      expect(e.method.reading, e.id).toBeTruthy();
      for (const row of e.method.rows) expect(row.length, e.id).toBe(e.method.columns.length);
    }
  });

  it("uses real audit-log columns for the admin login check", () => {
    const q = evidence.find((e) => e.id === "ev-dora-a9-02-2")!.method.query;
    for (const part of ["system.access.audit", "service_name = 'accounts'", "action_name", "request_params.user", "event_date"]) {
      expect(q).toContain(part);
    }
  });
});

describe("scoring", () => {
  it("bands scores into three words", () => {
    expect(scoreBand(80)).toBe("pass");
    expect(scoreBand(72)).toBe("watch");
    expect(scoreBand(49)).toBe("fix");
  });
  it("handles no controls", () => {
    expect(readinessScore({ pass: 0, watch: 0, fix: 0 })).toBe(0);
  });
});

describe("pricing", () => {
  it("gives 2 months free on annual billing", () => {
    const team = getPlan("team");
    expect(planPrice(team, "monthly")).toEqual({ perMonth: 990, billedNow: 990, yearlySaving: 0 });
    expect(planPrice(team, "annual")).toEqual({ perMonth: 825, billedNow: 9900, yearlySaving: 1980 });
  });
  it("makes the 5-pack cheaper than five singles", () => {
    expect(packSaving()).toBe(5 * 390 - 1690);
    expect(pricing.packs.pack5.credits).toBe(5);
  });
});

describe("mock checkout card", () => {
  it("only accepts the test card", () => {
    expect(isTestCard("4242 4242 4242 4242")).toBe(true);
    expect(isTestCard("4242424242424242")).toBe(true);
    expect(isTestCard("4111 1111 1111 1111")).toBe(false);
    expect(isTestCard("")).toBe(false);
  });
  it("formats typing in groups of four", () => {
    expect(formatCardNumber("42424242424242429999")).toBe("4242 4242 4242 4242");
  });
});

describe("report snapshots", () => {
  const base = { id: "a", regulationId: "all", createdAt: "2026-11-10T00:00:00Z" } as Report;

  it("filters by regulation and freezes a copy", () => {
    const snap = buildSnapshot("gdpr", controls, evidence);
    expect(snap.controlSnapshots).toHaveLength(6);
    expect(snap.statusCounts).toEqual({ pass: 4, watch: 1, fix: 1 });
    expect(snap.controlSnapshots[0]).not.toBe(controls.find((c) => c.regulationId === "gdpr"));
    expect(snap.controlSnapshots[0].evidence.length).toBeGreaterThan(0);
  });

  it("compares two reports", () => {
    const older = { ...base, ...buildSnapshot("all", controls, evidence) };
    const fixed = controls.map((c) => (c.id === "dora-a9-02" ? { ...c, status: "pass" as const } : c));
    const newer = { ...base, ...buildSnapshot("all", fixed, evidence) };
    const diff = compareReports(older, newer);
    expect(diff.changes).toEqual([
      { controlId: "dora-a9-02", plainTitle: "Are admin rights kept to a small group?", from: "fix", to: "pass" },
    ]);
    expect(diff.scoreDelta).toBeGreaterThan(0);
    expect(older.score).toBe(72);
  });

  it("allows free regeneration for 24 hours only", () => {
    const t0 = new Date(base.createdAt).getTime();
    expect(isFreeRegenerate(base, t0 + 23 * 3_600_000, 24)).toBe(true);
    expect(isFreeRegenerate(base, t0 + 25 * 3_600_000, 24)).toBe(false);
  });
});

describe("glossary", () => {
  it("finds technical words inside a sentence", () => {
    const parts = "38 of 41 risk tables have full lineage in Unity Catalog.".split(glossaryPattern);
    expect(parts.filter((p) => lookupTerm(p))).toEqual(["lineage", "Unity Catalog"]);
  });
});
