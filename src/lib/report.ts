import { countStatuses, readinessScore } from "./scoring";
import type { Control, ControlSnapshot, ControlStatus, Evidence, RegulationId, Report } from "@/mocks/types";

/** Copies controls and their evidence so later fixes never change an old report. */
export function buildSnapshot(
  regulationId: RegulationId | "all",
  controls: Control[],
  evidence: Evidence[],
): Pick<Report, "controlSnapshots" | "statusCounts" | "score"> {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const controlSnapshots: ControlSnapshot[] = controls
    .filter((c) => regulationId === "all" || c.regulationId === regulationId)
    .map((c) => ({
      ...c,
      evidenceIds: [...c.evidenceIds],
      fixSteps: [...c.fixSteps],
      evidence: c.evidenceIds.flatMap((id) => {
        const e = byId.get(id);
        return e ? [{ ...e }] : [];
      }),
    }));
  const statusCounts = countStatuses(controlSnapshots);
  return { controlSnapshots, statusCounts, score: readinessScore(statusCounts) };
}

export type ReportDiff = {
  scoreDelta: number;
  changes: { controlId: string; plainTitle: string; from: ControlStatus; to: ControlStatus }[];
};

/** What changed between an older report and a newer one. */
export function compareReports(older: Report, newer: Report): ReportDiff {
  const before = new Map(older.controlSnapshots.map((c) => [c.id, c.status]));
  const changes = newer.controlSnapshots.flatMap((c) => {
    const from = before.get(c.id);
    return from && from !== c.status ? [{ controlId: c.id, plainTitle: c.plainTitle, from, to: c.status }] : [];
  });
  return { scoreDelta: newer.score - older.score, changes };
}

/** Regenerating a report is free for a while after it was made. */
export function isFreeRegenerate(report: Pick<Report, "createdAt">, now: number, windowHours: number): boolean {
  return now - new Date(report.createdAt).getTime() < windowHours * 3_600_000;
}
