/**
 * Glossary: every technical word the app may show, with a one-sentence,
 * plain-language explanation. Used by <Term> and <GlossaryText>.
 */
export const glossary = {
  lineage: {
    term: "Lineage",
    aliases: ["lineage"],
    definition: "A map that shows where a number came from and every step it went through on the way.",
  },
  unityCatalog: {
    term: "Unity Catalog",
    aliases: ["Unity Catalog"],
    definition: "The part of Databricks that keeps track of all your data and who is allowed to see it.",
  },
  catalog: {
    term: "Catalog",
    aliases: ["catalog", "catalogs"],
    definition: "A top-level folder of data in Databricks, usually one per business area.",
  },
  dataOwner: {
    term: "Data owner",
    aliases: ["data owner", "data owners", "owner tag", "owner tags"],
    definition: "The named person or team who answers for a set of data being correct and safe.",
  },
  workspace: {
    term: "Workspace",
    aliases: ["workspace", "workspaces"],
    definition: "One Databricks environment where your teams run their data work. Most companies have a few.",
  },
  databricks: {
    term: "Databricks",
    aliases: ["Databricks"],
    definition: "The data platform your company uses to store and work with its data.",
  },
  systemTables: {
    term: "System tables",
    aliases: ["system tables", "system table"],
    definition: "Built-in logs that Databricks keeps about who did what, and when.",
  },
  control: {
    term: "Control",
    aliases: ["control", "controls"],
    definition: "One thing a regulation asks you to prove, such as “only the right people can see customer data”.",
  },
  evidence: {
    term: "Evidence",
    aliases: ["evidence"],
    definition: "The proof behind a control: a log, a setting or a record an auditor can check.",
  },
  dora: {
    term: "DORA",
    aliases: ["DORA"],
    definition: "An EU law that makes financial firms prove their IT and data systems can cope with trouble.",
  },
  bcbs239: {
    term: "BCBS 239",
    aliases: ["BCBS 239"],
    definition: "Banking rules that say risk numbers must be accurate, complete and traceable.",
  },
  gdpr: {
    term: "GDPR",
    aliases: ["GDPR"],
    definition: "The EU law that protects people’s personal data.",
  },
  accessGrant: {
    term: "Access grant",
    aliases: ["access grant", "access grants", "grants"],
    definition: "A permission that lets a person or group see or change some data.",
  },
  retention: {
    term: "Retention rule",
    aliases: ["retention rule", "retention rules", "retention"],
    definition: "A rule that says how long data is kept before it is deleted.",
  },
  dataQuality: {
    term: "Data quality check",
    aliases: ["data quality check", "data quality checks", "quality checks"],
    definition: "An automatic test that makes sure data is complete and makes sense.",
  },
  pipeline: {
    term: "Pipeline",
    aliases: ["pipeline", "pipelines"],
    definition: "A set of automatic steps that moves and tidies data, a bit like a factory line.",
  },
  notebook: {
    term: "Notebook",
    aliases: ["notebook", "notebooks"],
    definition: "A document where engineers write and run code by hand.",
  },
  pii: {
    term: "Personal data",
    aliases: ["PII", "personal data"],
    definition: "Anything that can identify a person, like a name, an address or an account number.",
  },
  timeTravel: {
    term: "Time travel",
    aliases: ["time travel"],
    definition: "A Databricks feature that lets you see or restore data as it was on an earlier day.",
  },
  pullRequest: {
    term: "Pull request",
    aliases: ["pull request", "pull requests"],
    definition: "A change to code that a second person must review and approve before it goes live.",
  },
  servicePrincipal: {
    term: "Service principal",
    aliases: ["service principal", "service principals"],
    definition: "A login made for software instead of a person. It can only do what it has been allowed to do.",
  },
  sqlWarehouse: {
    term: "SQL warehouse",
    aliases: ["SQL warehouse", "SQL warehouses"],
    definition: "The engine in Databricks that runs questions written in SQL.",
  },
  auditLog: {
    term: "Audit log",
    aliases: ["audit log", "audit logs"],
    definition: "A record Databricks keeps of who did what, and when.",
  },
  schema: {
    term: "Schema",
    aliases: ["schema", "schemas"],
    definition: "A folder inside a catalog that groups related tables.",
  },
  tag: {
    term: "Tag",
    aliases: ["tag", "tags"],
    definition: "A label stuck on data, such as “owner” or “personal data”, so people and tools can find it.",
  },
} as const;

export type GlossaryKey = keyof typeof glossary;

const aliasToKey = new Map<string, GlossaryKey>();
for (const [key, entry] of Object.entries(glossary)) {
  for (const alias of entry.aliases) aliasToKey.set(alias.toLowerCase(), key as GlossaryKey);
}

const escaped = [...aliasToKey.keys()]
  .sort((a, b) => b.length - a.length)
  .map((a) => a.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));

/** Splits text so glossary words become their own parts (capturing group keeps them). */
export const glossaryPattern = new RegExp(`\\b(${escaped.join("|")})\\b`, "gi");

export function lookupTerm(word: string): GlossaryKey | undefined {
  return aliasToKey.get(word.toLowerCase());
}
