import type { Regulation, Workspace } from "../types";

/** The demo customer: a fictional Nordic bank. */
export const demoOrg = { id: "org-nordlys", name: "Nordlys Bank", country: "Norway" };

export const regulations: Regulation[] = [
  {
    id: "dora",
    name: "DORA",
    plainName: "Can your systems cope with trouble?",
    description: "The EU Digital Operational Resilience Act. It asks you to prove your IT and data keep working, and recover, when things go wrong.",
  },
  {
    id: "bcbs239",
    name: "BCBS 239",
    plainName: "Can you trust your risk numbers?",
    description: "The Basel principles for risk data. They ask you to prove risk numbers are accurate, complete, on time and traceable.",
  },
  {
    id: "gdpr",
    name: "GDPR",
    plainName: "Is personal data looked after?",
    description: "The EU General Data Protection Regulation. It asks you to prove personal data is known, protected and deleted on time.",
  },
];

export const workspaces: Workspace[] = [
  {
    id: "ws-prod",
    name: "nordlys-prod",
    url: "https://adb-7402115509.12.azuredatabricks.net",
    cloud: "Azure",
    region: "Norway East",
    status: "connected",
    lastScanAt: "2026-11-10T06:12:00Z",
    catalogs: ["risk", "finance", "customers", "payments", "treasury", "lending", "markets", "compliance", "reference"],
  },
  {
    id: "ws-analytics",
    name: "nordlys-analytics",
    url: "https://adb-7402118834.7.azuredatabricks.net",
    cloud: "Azure",
    region: "West Europe",
    status: "connected",
    lastScanAt: "2026-11-10T06:12:00Z",
    catalogs: ["analytics", "sandbox", "treasury_sandbox", "reporting", "ml_features"],
  },
];

/** Readiness score from earlier (mocked) monthly scans, oldest first. The current score is added at the end. */
export const scoreHistory = [
  { label: "Jun", score: 58 },
  { label: "Jul", score: 61 },
  { label: "Aug", score: 64 },
  { label: "Sep", score: 66 },
  { label: "Oct", score: 70 },
];

/** Order in which a re-scan "finds" that the platform team fixed something. */
export const fixOrder = ["dora-a9-02", "bcbs-p7-01", "gdpr-a5-01", "bcbs-p3-01", "dora-a8-02", "gdpr-a17-01"];
