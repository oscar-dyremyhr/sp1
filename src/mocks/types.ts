export type RegulationId = "dora" | "bcbs239" | "gdpr";
export type ControlStatus = "pass" | "watch" | "fix";
export type PlanId = "trial" | "payg" | "team" | "enterprise";
export type Role = "owner" | "member" | "viewer";
export type Audience = "auditor" | "board" | "internal";
export type EvidenceType =
  | "lineage"
  | "dq_check"
  | "access_grant"
  | "change_record"
  | "retention_policy"
  | "ownership_tag";

export type Organization = {
  id: string;
  name: string;
  country: string;
  plan: PlanId;
  credits: number;
  seats: number;
  trialEndsAt: string;
};

export type User = { id: string; name: string; email: string; role: Role };

export type Workspace = {
  id: string;
  name: string;
  url: string;
  cloud: string;
  region: string;
  status: "connected" | "pending";
  lastScanAt: string;
  catalogs: string[];
};

export type Regulation = { id: RegulationId; name: string; plainName: string; description: string };

export type Control = {
  id: string;
  regulationId: RegulationId;
  ref: string;
  plainTitle: string;
  formalTitle: string;
  explanation: string;
  status: ControlStatus;
  evidenceIds: string[];
  fixSteps: string[];
  owner: string;
  logic: ControlLogic;
};

/** How one piece of evidence was collected: the read-only call and a sample of what came back. */
export type EvidenceMethod = {
  via: "sql" | "rest" | "git";
  query: string;
  columns: string[];
  rows: string[][];
  /** Rows that came back but are not shown in the sample. */
  more?: number;
  /** Plain sentence: how the rows become the finding. */
  reading: string;
  note?: string;
  /** True when the query was filled in from the organisation's data map. */
  usesMap?: boolean;
};

/** The rule that turns a control's evidence into one of the three statuses. */
export type ControlLogic = { rule: string; result: string };

export type Evidence = {
  id: string;
  type: EvidenceType;
  source: string;
  summary: string;
  capturedAt: string;
  details: string;
  method: EvidenceMethod;
};

export type StatusCounts = Record<ControlStatus, number>;

/** A control frozen at report time, with its evidence copied in. */
export type ControlSnapshot = Control & { evidence: Evidence[] };

export type ReportScope = { workspaceIds: string[]; catalogs: string[] };

export type Report = {
  id: string;
  regulationId: RegulationId | "all";
  scope: ReportScope;
  audience: Audience;
  createdAt: string;
  createdBy: string;
  orgName: string;
  score: number;
  statusCounts: StatusCounts;
  controlSnapshots: ControlSnapshot[];
  shareToken: string;
};

export type Invoice = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: "paid" | "open";
};

export type ControlFilter = { regulationId?: RegulationId | "all"; status?: ControlStatus | "all" };

// ---------- Data map: how this organisation organises and tags its data ----------

export type WorkspaceStructure = { name: string; workspace: string; schemas: { name: string; tables: string[] }[] }[];

export type DiscoveredTag = { name: string; on: "catalogs" | "tables" | "columns"; count: number; values?: string[] };

/** A kind of data that checks need to find. */
export type DataRole = "risk" | "board" | "personal" | "test";

/** A meaning that the organisation expresses with a tag. */
export type TagKey = "pii" | "criticality" | "owner" | "retention" | "businessService" | "purpose" | "sensitivity";

export type TagSetting = { name: string; value?: string };

export type Policies = { adminLimit: number; historyDays: number; restoreTestMonths: number; loadDeadline: string };

export type DataMap = {
  /** Paths: "catalog", "catalog.schema" or "catalog.schema.table". A catalog or schema covers everything inside it, now and later. */
  roles: Record<DataRole, string[]>;
  tags: Record<TagKey, TagSetting>;
  policies: Policies;
  /** null until someone has checked the first guess and saved it. */
  confirmedAt: string | null;
};

export type MapRecommendation = {
  id: string;
  title: string;
  body: string;
  /** One-click fix: add this path to this role, or use this tag name. */
  action?: { label: string; role?: DataRole; path?: string; tag?: TagKey; tagName?: string };
};
