import type { DataMap, DataRole, DiscoveredTag, TagKey, WorkspaceStructure } from "@/mocks/types";

/** Children of a path in the catalog → schema → table tree. */
export function childrenOf(path: string, structure: WorkspaceStructure): string[] {
  const [catalog, schema, table] = path.split(".");
  const c = structure.find((x) => x.name === catalog);
  if (!c || table) return [];
  if (!schema) return c.schemas.map((s) => `${catalog}.${s.name}`);
  return (c.schemas.find((s) => s.name === schema)?.tables ?? []).map((t) => `${path}.${t}`);
}

/** Selected itself, or inside a selected catalog or schema. */
export function isCovered(paths: string[], path: string): boolean {
  return paths.some((p) => p === path || path.startsWith(`${p}.`));
}

/** Not covered, but something inside it is selected. */
export function isPartial(paths: string[], path: string): boolean {
  return !isCovered(paths, path) && paths.some((p) => p.startsWith(`${path}.`));
}

/**
 * Tick or untick one item. Ticking a catalog or schema replaces any single
 * picks inside it. Unticking an item inside a selected parent keeps the
 * parent's other children selected.
 */
export function togglePath(paths: string[], path: string, structure: WorkspaceStructure): string[] {
  if (paths.includes(path)) return paths.filter((p) => p !== path);
  const ancestor = paths.find((p) => path.startsWith(`${p}.`));
  if (ancestor) {
    const result = paths.filter((p) => p !== ancestor);
    let current = ancestor;
    while (current !== path) {
      const kids = childrenOf(current, structure);
      const next = kids.find((k) => k === path || path.startsWith(`${k}.`));
      if (!next) break;
      result.push(...kids.filter((k) => k !== next));
      current = next;
    }
    return result;
  }
  return [...paths.filter((p) => !p.startsWith(`${path}.`)), path];
}

/** How many tables a set of paths covers today. */
export function countTables(paths: string[], structure: WorkspaceStructure): number {
  let n = 0;
  for (const c of structure) for (const s of c.schemas) for (const t of s.tables) if (isCovered(paths, `${c.name}.${s.name}.${t}`)) n++;
  return n;
}

const TEST_NAME = /(^|_)(sandbox|scratch|test|dev|tmp)(_|$)/i;
// "board" as its own word, so "onboarding" and "dashboards" do not match.
const BOARD_NAME = /(^|_)boards?(_|$)/i;

/** A first guess from names and tags, so nobody starts from an empty page. */
export function suggestDataMap(structure: WorkspaceStructure, tags: DiscoveredTag[]): DataMap {
  const schemas = structure.flatMap((c) => c.schemas.map((s) => ({ catalog: c.name, schema: s.name })));
  const has = (name: string) => tags.some((t) => t.name === name);
  const pick = (candidates: string[], fallback: string) => candidates.find(has) ?? fallback;
  return {
    roles: {
      risk: schemas.filter((s) => s.catalog === "risk" && /regulat/i.test(s.schema)).map((s) => `${s.catalog}.${s.schema}`),
      board: schemas.filter((s) => BOARD_NAME.test(s.schema)).map((s) => `${s.catalog}.${s.schema}`),
      personal: structure.filter((c) => /customer/i.test(c.name)).map((c) => c.name),
      test: structure.filter((c) => TEST_NAME.test(c.name)).map((c) => c.name),
    },
    tags: {
      pii: { name: pick(["pii", "personal_data"], "pii") },
      criticality: { name: pick(["criticality", "tier"], "criticality"), value: "critical" },
      owner: { name: pick(["owner", "data_owner"], "owner") },
      retention: { name: pick(["retention_days", "retention"], "retention_days") },
      businessService: { name: pick(["business_service"], "business_service") },
      purpose: { name: pick(["processing_purpose", "purpose"], "processing_purpose") },
      sensitivity: { name: pick(["sensitivity", "classification"], "sensitivity"), value: "sensitive" },
    },
    policies: { adminLimit: 4, historyDays: 30, restoreTestMonths: 12, loadDeadline: "06:00" },
    confirmedAt: null,
  };
}

/** Tag names that commonly carry each meaning. Used to guess, and to offer look-alikes found in the workspace. */
export const TAG_FAMILIES: Record<TagKey, string[]> = {
  pii: ["pii", "personal_data", "gdpr"],
  criticality: ["criticality", "tier", "critical"],
  owner: ["owner", "data_owner", "steward"],
  retention: ["retention_days", "retention"],
  businessService: ["business_service", "service"],
  purpose: ["processing_purpose", "purpose"],
  sensitivity: ["sensitivity", "classification", "confidentiality"],
};

/** SQL condition that matches everything a role covers: catalogs, schemas and single tables. */
export function scopePredicate(column: string, paths: string[]): string {
  if (paths.length === 0) return "FALSE  /* nothing mapped yet: see Data map */";
  const parts = paths.map((p) => (p.split(".").length === 3 ? `${column} = '${p}'` : `${column} LIKE '${p}.%'`));
  return parts.length === 1 ? parts[0] : `(${parts.join("\n       OR ")})`;
}

/** Fills {{tag.*}} and {{scope:role:column}} placeholders in a check's query from the data map. */
export function renderQuery(query: string, map: DataMap): { query: string; usesMap: boolean } {
  let usesMap = false;
  const rendered = query
    .replace(/\{\{tag\.(\w+)(\.value)?\}\}/g, (_, key: TagKey, value?: string) => {
      usesMap = true;
      const tag = map.tags[key];
      return (value ? tag?.value : tag?.name) ?? key;
    })
    .replace(/\{\{scope:(\w+):([\w.]+)\}\}/g, (_, role: DataRole, column: string) => {
      usesMap = true;
      return scopePredicate(column, map.roles[role] ?? []);
    });
  return { query: rendered, usesMap };
}

/** Raw findings behind the recommendations. The screen turns them into words. */
export function mapFindings(map: DataMap, structure: WorkspaceStructure, tags: DiscoveredTag[]) {
  const roles = Object.keys(map.roles) as DataRole[];
  const allTables = structure.flatMap((c) => c.schemas.flatMap((s) => s.tables.map((t) => `${c.name}.${s.name}.${t}`)));
  return {
    /** Roles with nothing mapped. */
    emptyRoles: roles.filter((r) => map.roles[r].length === 0),
    /** Tables picked one by one, per role. */
    singleTables: roles.map((r) => ({ role: r, count: map.roles[r].filter((p) => p.split(".").length === 3).length })).filter((x) => x.count > 0),
    /** Tables that look like board reports but sit outside the board data. */
    strayBoard: allTables.filter((t) => BOARD_NAME.test(t.split(".")[2]) && !isCovered(map.roles.board, t)),
    /** Catalogs whose name suggests test data but are not marked as test. */
    strayTest: structure.filter((c) => TEST_NAME.test(c.name) && !isCovered(map.roles.test, c.name)).map((c) => c.name),
    /** A second tag that means the same as the chosen one. */
    duplicateTags: (
      [
        ["pii", ["pii", "personal_data"]],
        ["owner", ["owner", "data_owner"]],
      ] as [TagKey, string[]][]
    ).flatMap(([key, family]) =>
      tags.filter((t) => family.includes(t.name) && t.name !== map.tags[key].name).map((t) => ({ key, chosen: map.tags[key].name, other: t.name, count: t.count, on: t.on })),
    ),
  };
}
