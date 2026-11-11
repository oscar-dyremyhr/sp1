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
};

export type Evidence = {
  id: string;
  type: EvidenceType;
  source: string;
  summary: string;
  capturedAt: string;
  details: string;
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
