import { beforeEach, describe, expect, it } from "vitest";
import { countTables, isCovered, isPartial, mapFindings, renderQuery, scopePredicate, suggestDataMap, togglePath } from "@/lib/datamap";
import { discoveredTags, structure } from "@/mocks/fixtures/structure";
import { getControl, getDataMap, resetDemo, saveDataMap, setMockSpeed, signUp } from "@/mocks/service";

const guess = () => suggestDataMap(structure, discoveredTags);

describe("workspace structure fixture", () => {
  it("mirrors the 14 catalogs of Nordlys Bank", () => {
    expect(structure).toHaveLength(14);
    expect(structure.every((c) => c.schemas.length > 0 && c.schemas.every((s) => s.tables.length > 0))).toBe(true);
  });
});

describe("picking where things live", () => {
  it("a schema covers its tables, and a catalog covers everything in it", () => {
    expect(isCovered(["risk.board"], "risk.board.agg_capital_ratios")).toBe(true);
    expect(isCovered(["risk"], "risk.board.agg_capital_ratios")).toBe(true);
    expect(isCovered(["risk.board"], "risk.regulatory.fct_credit_exposure")).toBe(false);
    expect(isCovered(["risk.board"], "risk.boardroom")).toBe(false);
    expect(isPartial(["risk.board"], "risk")).toBe(true);
    expect(isPartial(["risk"], "risk")).toBe(false);
  });

  it("ticking a whole schema replaces single picks inside it", () => {
    const paths = togglePath(["risk.board.agg_capital_ratios", "finance"], "risk.board", structure);
    expect(paths.sort()).toEqual(["finance", "risk.board"]);
  });

  it("unticking one table keeps the rest of the schema", () => {
    const paths = togglePath(["risk.board"], "risk.board.agg_risk_appetite", structure);
    expect(paths.sort()).toEqual(["risk.board.agg_capital_ratios", "risk.board.agg_large_exposures", "risk.board.agg_liquidity_summary"]);
  });

  it("unticking one table inside a whole catalog keeps the other schemas whole", () => {
    const paths = togglePath(["risk"], "risk.board.agg_risk_appetite", structure);
    expect(paths).toContain("risk.regulatory");
    expect(paths).toContain("risk.staging");
    expect(paths).not.toContain("risk");
    expect(isCovered(paths, "risk.board.agg_risk_appetite")).toBe(false);
    expect(countTables(paths, structure)).toBe(countTables(["risk"], structure) - 1);
  });
});

describe("first guess", () => {
  it("guesses roles from names and tags from what the workspace uses", () => {
    const map = guess();
    expect(map.roles.board).toEqual(["risk.board"]);
    expect(map.roles.risk).toEqual(["risk.regulatory"]);
    expect(map.roles.personal).toEqual(["customers"]);
    expect(map.roles.test).toEqual(["sandbox", "treasury_sandbox"]);
    expect(map.tags.pii.name).toBe("pii");
    expect(map.confirmedAt).toBeNull();
  });

  it("recommends fixes: a stray board table and a second personal-data tag", () => {
    const f = mapFindings(guess(), structure, discoveredTags);
    expect(f.strayBoard).toEqual(["finance.reporting.agg_board_kpi_pack"]);
    expect(f.duplicateTags.map((d) => d.other)).toEqual(["personal_data", "data_owner"]);
    expect(f.emptyRoles).toEqual([]);
  });
});

describe("queries follow the data map", () => {
  it("builds a condition for catalogs, schemas and single tables", () => {
    expect(scopePredicate("t", ["risk.board"])).toBe("t LIKE 'risk.board.%'");
    expect(scopePredicate("t", ["risk.board", "finance.reporting.agg_board_kpi_pack"])).toContain("t = 'finance.reporting.agg_board_kpi_pack'");
    expect(scopePredicate("t", [])).toContain("FALSE");
  });

  it("fills in tag names and scopes", () => {
    const map = guess();
    map.tags.pii.name = "personopplysning";
    const out = renderQuery("WHERE tag_name = '{{tag.pii}}' AND {{scope:board:x}} AND v = '{{tag.criticality.value}}'", map);
    expect(out.query).toBe("WHERE tag_name = 'personopplysning' AND x LIKE 'risk.board.%' AND v = 'critical'");
    expect(out.usesMap).toBe(true);
    expect(renderQuery("SELECT 1", map).usesMap).toBe(false);
  });
});

describe("data map in the service", () => {
  beforeEach(async () => {
    setMockSpeed(0);
    await signUp({ name: "Ingrid", email: `map+${Math.random()}@nordlys.example`, company: "Nordlys Bank" });
  });

  it("starts as a guess, is remembered once saved, and is cleared by reset", async () => {
    const first = await getDataMap();
    expect(first.map.confirmedAt).toBeNull();
    await saveDataMap({ ...first.map, tags: { ...first.map.tags, pii: { name: "personal_data" } } });
    const again = await getDataMap();
    expect(again.map.confirmedAt).not.toBeNull();
    expect(again.map.tags.pii.name).toBe("personal_data");
    await resetDemo();
    expect((await getDataMap()).map.confirmedAt).toBeNull();
  });

  it("uses the saved map in the checks' queries", async () => {
    const { map } = await getDataMap();
    await saveDataMap({
      ...map,
      tags: { ...map.tags, pii: { name: "personal_data" } },
      roles: { ...map.roles, board: ["risk.board", "finance.reporting.agg_board_kpi_pack"] },
    });
    const pii = await getControl("gdpr-a30-01");
    expect(pii.evidence[0].method.query).toContain("WHERE tag_name = 'personal_data'");
    expect(pii.evidence[0].method.usesMap).toBe(true);
    const board = await getControl("bcbs-p7-01");
    expect(board.evidence[1].method.query).toContain("target_table_full_name = 'finance.reporting.agg_board_kpi_pack'");
    // No placeholder is ever shown to a person.
    for (const id of ["dora-a8-01", "dora-a8-02", "dora-a9-01", "gdpr-a5-01", "gdpr-a32-01", "gdpr-a25-01"]) {
      for (const e of (await getControl(id)).evidence) expect(e.method.query).not.toContain("{{");
    }
  });
});
