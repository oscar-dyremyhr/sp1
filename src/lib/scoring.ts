import type { ControlStatus, StatusCounts } from "@/mocks/types";

/** A "keep an eye on it" control counts for 40% of a "looks good" one. */
const WATCH_WEIGHT = 0.4;

export function countStatuses(items: { status: ControlStatus }[]): StatusCounts {
  const counts: StatusCounts = { pass: 0, watch: 0, fix: 0 };
  for (const item of items) counts[item.status] += 1;
  return counts;
}

/** Readiness score from 0 to 100. */
export function readinessScore(counts: StatusCounts): number {
  const total = counts.pass + counts.watch + counts.fix;
  if (total === 0) return 0;
  return Math.floor((100 * (counts.pass + WATCH_WEIGHT * counts.watch)) / total);
}

/** Scores always come with a word: 80+ looks good, 50–79 keep an eye on it, below 50 needs fixing. */
export function scoreBand(score: number): ControlStatus {
  if (score >= 80) return "pass";
  if (score >= 50) return "watch";
  return "fix";
}
