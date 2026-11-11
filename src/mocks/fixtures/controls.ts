import type { Control, ControlStatus, Evidence, EvidenceType, RegulationId } from "../types";
import { logic, methods } from "./methods";

/**
 * 24 illustrative controls for the fictional Nordlys Bank:
 * DORA 10, BCBS 239 8, GDPR 6. Seeded to 15 pass, 6 watch, 3 fix (score 72).
 * SAMPLE CONTENT: these are not real regulatory mappings.
 */
const CAPTURED = "2026-11-10T06:12:00Z";
const PLATFORM = "Data platform team";

type Seed = {
  id: string;
  reg: RegulationId;
  ref: string;
  plain: string;
  formal: string;
  status: ControlStatus;
  why: string;
  ev: [type: EvidenceType, source: string, summary: string, details?: string][];
  fix?: string[];
  owner?: string;
};

const seeds: Seed[] = [
  // ---------- DORA (10): 6 pass, 3 watch, 1 fix ----------
  {
    id: "dora-a8-01",
    reg: "dora",
    ref: "DORA, Article 8(1) (Identification)",
    plain: "Do you know every important data system you run?",
    formal: "ICT assets and information assets are identified, classified and documented",
    status: "pass",
    why: "All 14 catalogs are registered in Unity Catalog and each one is linked to a business service.",
    ev: [
      ["ownership_tag", "system.information_schema.catalog_tags", "14 of 14 catalogs carry a business_service tag.", "Checked across both workspaces."],
      ["lineage", "system.access.table_lineage", "2,318 tables are mapped to the systems that feed them."],
    ],
  },
  {
    id: "dora-a8-02",
    reg: "dora",
    ref: "DORA, Article 8(4) (Identification)",
    plain: "Does every critical dataset have a named owner?",
    formal: "Roles and responsibilities for information assets are assigned and documented",
    status: "watch",
    why: "212 of 236 critical tables have an owner tag. 24 tables in the treasury_sandbox catalog have none.",
    ev: [
      ["ownership_tag", "system.information_schema.table_tags", "212 of 236 critical tables have an owner tag.", "24 untagged tables sit in treasury_sandbox."],
    ],
    fix: ["Add an owner tag to the 24 tables in treasury_sandbox", "Turn on the rule that blocks new tables without an owner", "Re-scan to confirm"],
  },
  {
    id: "dora-a9-01",
    reg: "dora",
    ref: "DORA, Article 9(4)(c) (Protection and prevention)",
    plain: "Is sensitive data only open to people who need it?",
    formal: "Access to information assets is limited to what is required for legitimate functions",
    status: "pass",
    why: "Access to sensitive tables is given to groups, never to single people, and every group has an approver.",
    ev: [
      ["access_grant", "system.information_schema.table_privileges", "All 1,946 grants on sensitive tables go to groups.", "0 grants go straight to individual users."],
      ["change_record", "system.access.audit", "Every grant in the last 90 days has a named approver."],
    ],
  },
  {
    id: "dora-a9-02",
    reg: "dora",
    ref: "DORA, Article 9(4)(d) (Protection and prevention)",
    plain: "Are admin rights kept to a small group?",
    formal: "Strong authentication and privileged-access management policies are implemented",
    status: "fix",
    why: "11 people have admin rights on the production workspace. Your own policy allows 4.",
    ev: [
      ["access_grant", "Identity API: /scim/v2/Groups", "11 accounts hold the workspace admin role on nordlys-prod.", "The access policy (v3.2) sets the limit at 4."],
      ["change_record", "system.access.audit", "3 admin accounts have not logged in for over 90 days."],
    ],
    fix: [
      "Remove admin rights from the 7 accounts that do not need them",
      "Move the remaining 4 admins into one group with an approver",
      "Re-scan to confirm",
    ],
  },
  {
    id: "dora-a9-03",
    reg: "dora",
    ref: "DORA, Article 9(4)(e) (Protection and prevention)",
    plain: "Are changes checked by a second person before they go live?",
    formal: "ICT change management is documented, tested, approved and controlled",
    status: "pass",
    why: "All 312 changes to production pipelines in the last 90 days went through a pull request with an approval.",
    ev: [
      ["change_record", "git: nordlys/lakehouse-pipelines", "312 of 312 merged pull requests had at least one approval.", "Branch protection is on for main."],
      ["change_record", "Jobs API: /api/2.2/jobs/list", "No production job ran from an unreviewed branch."],
    ],
  },
  {
    id: "dora-a10-01",
    reg: "dora",
    ref: "DORA, Article 10(1) (Detection)",
    plain: "Would you notice unusual activity on your data?",
    formal: "Mechanisms are in place to promptly detect anomalous activities",
    status: "pass",
    why: "Activity logs are switched on in both workspaces and alerts go to the security team within minutes.",
    ev: [
      ["change_record", "system.access.audit", "Audit logging is on for both workspaces with 365 days kept.", "Latest event captured 4 minutes before the scan."],
    ],
  },
  {
    id: "dora-a11-01",
    reg: "dora",
    ref: "DORA, Article 12(1) (Backup and restoration)",
    plain: "Can you bring data back if something goes wrong?",
    formal: "Backup policies and restoration procedures are documented and applied",
    status: "watch",
    why: "9 of 14 catalogs keep 30 days of time travel. 5 catalogs keep only 7 days, which is below your policy.",
    ev: [
      ["retention_policy", "Unity Catalog API: /unity-catalog/tables", "9 of 14 catalogs keep 30 days of history.", "analytics, sandbox, treasury_sandbox, reporting and ml_features keep 7 days."],
    ],
    fix: ["Raise the history setting to 30 days on the 5 catalogs", "Re-scan to confirm"],
  },
  {
    id: "dora-a12-01",
    reg: "dora",
    ref: "DORA, Article 12(2) (Backup and restoration)",
    plain: "Have you practised recovering from a failure this year?",
    formal: "Backup and restoration procedures are tested periodically",
    status: "watch",
    why: "The last recorded restore test was 14 months ago. Your policy asks for one every 12 months.",
    ev: [
      ["change_record", "git: nordlys/platform-runbooks", "Last restore test record is dated 3 Sep 2025.", "Policy asks for a test every 12 months."],
    ],
    fix: ["Run a restore test on one production catalog", "Save the result in the runbooks repository", "Re-scan to confirm"],
  },
  {
    id: "dora-a17-01",
    reg: "dora",
    ref: "DORA, Article 17(1) (Incident management)",
    plain: "Are data problems written down and followed up?",
    formal: "ICT-related incidents are detected, managed, recorded and notified",
    status: "pass",
    why: "Every failed production job in the last 90 days opened a ticket, and every ticket was closed with a cause.",
    ev: [
      ["change_record", "system.lakeflow.job_run_timeline", "41 failed production runs, 41 linked incident tickets.", "Median time to close: 3 hours."],
    ],
  },
  {
    id: "dora-a28-01",
    reg: "dora",
    ref: "DORA, Article 28(3) (ICT third-party risk)",
    plain: "Do you know which outside companies can touch your data?",
    formal: "A register of contractual arrangements with ICT third-party providers is maintained",
    status: "pass",
    why: "Data is shared with 3 outside companies. All 3 are on your supplier list and can only read what they need.",
    ev: [
      ["access_grant", "system.information_schema.recipients", "3 external recipients, each matched to a supplier record.", "All shares are read-only."],
      ["ownership_tag", "system.information_schema.external_locations", "6 storage locations, all inside EU regions."],
    ],
  },

  // ---------- BCBS 239 (8): 5 pass, 2 watch, 1 fix ----------
  {
    id: "bcbs-p1-01",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 1 (Governance)",
    plain: "Does someone senior sign off your risk data rules?",
    formal: "Risk data aggregation is subject to strong governance arrangements",
    status: "pass",
    why: "The risk data policy was approved by the Chief Risk Officer in March and every risk catalog names its owner.",
    ev: [
      ["ownership_tag", "system.information_schema.catalog_tags", "risk, finance and treasury catalogs each name an accountable executive."],
      ["change_record", "git: nordlys/data-policies", "Risk data policy v4.1 approved 12 Mar 2026."],
    ],
  },
  {
    id: "bcbs-p2-01",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 2 (Data architecture and IT infrastructure)",
    plain: "Is risk data kept in one agreed place, with clear names?",
    formal: "Data architecture supports risk data aggregation in normal times and in stress",
    status: "pass",
    why: "All risk tables live in the risk catalog and follow the naming rules. Nothing important sits in personal folders.",
    ev: [
      ["ownership_tag", "system.information_schema.table_tags", "41 of 41 regulatory risk tables are in the risk catalog."],
      ["dq_check", "system.information_schema.tables", "100% of risk tables follow the naming standard."],
    ],
  },
  {
    id: "bcbs-p3-01",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 3 (Accuracy and integrity)",
    plain: "Can you show where your risk numbers come from?",
    formal: "Risk data is accurate and reliable, and aggregated on a largely automated basis",
    status: "watch",
    why: "38 of 41 risk tables have full lineage back to source. 3 tables were built by hand-run notebooks.",
    ev: [
      ["lineage", "system.access.table_lineage", "38 of 41 risk tables trace back to their source systems."],
      ["lineage", "system.access.table_lineage", "3 tables have no upstream link: they are filled by notebooks run by hand."],
      ["change_record", "system.access.table_lineage", "No scheduled job writes to the 3 tables."],
    ],
    fix: ["Move the 3 notebooks into a scheduled job", "Re-scan to capture lineage"],
  },
  {
    id: "bcbs-p3-02",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 3 (Accuracy and integrity)",
    plain: "Are your risk numbers checked automatically?",
    formal: "Controls over risk data are as robust as those applicable to accounting data",
    status: "pass",
    why: "128 data quality checks run on the risk tables every day. 127 passed in the last run and the 1 warning was reviewed.",
    ev: [
      ["dq_check", "system.data_quality_monitoring.table_results", "128 checks on risk tables, 99.2% passing over 30 days."],
    ],
  },
  {
    id: "bcbs-p4-01",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 4 (Completeness)",
    plain: "Is any risk data missing from your reports?",
    formal: "All material risk data across the banking group is captured and aggregated",
    status: "pass",
    why: "All 9 legal entities and all 6 risk types show up in the group exposure tables every day.",
    ev: [
      ["dq_check", "system.data_quality_monitoring.table_results", "Completeness check: 9 of 9 entities present on each of the last 90 days."],
    ],
  },
  {
    id: "bcbs-p5-01",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 5 (Timeliness)",
    plain: "Is risk data ready on time each day?",
    formal: "Aggregated risk data is generated in a timely manner",
    status: "watch",
    why: "The daily risk load met its 06:00 deadline on 84 of the last 90 days. 6 runs finished late.",
    ev: [
      ["change_record", "system.lakeflow.job_run_timeline", "84 of 90 daily runs finished before 06:00.", "Latest finish in the period: 08:47."],
    ],
    fix: ["Find out why the 6 late runs were slow", "Add an alert when the load is still running at 05:30", "Re-scan next month"],
  },
  {
    id: "bcbs-p6-01",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 6 (Adaptability)",
    plain: "Can you answer a new question from the regulator quickly?",
    formal: "Risk data can be aggregated to meet ad hoc requests, including during stress",
    status: "pass",
    why: "Risk data can be cut by entity, country, product and counterparty without new engineering work.",
    ev: [
      ["lineage", "system.information_schema.columns", "All 4 reporting dimensions are present on the group exposure table."],
    ],
  },
  {
    id: "bcbs-p7-01",
    reg: "bcbs239",
    ref: "BCBS 239, Principle 7 (Accuracy of reporting)",
    plain: "Do the numbers in board reports match the source data?",
    formal: "Risk management reports accurately and precisely convey aggregated risk data",
    status: "fix",
    why: "2 of 12 board report tables are changed by hand after loading. Hand edits leave no trail an auditor can follow.",
    ev: [
      ["change_record", "system.access.audit", "17 manual UPDATE statements on 2 board report tables in 90 days.", "Run by 2 named users from the SQL editor."],
      ["lineage", "system.access.table_lineage", "10 of 12 board report tables are written only by scheduled jobs."],
    ],
    fix: [
      "Stop hand edits on the 2 tables by removing write access for people",
      "Move the corrections into the pipeline so they are logged",
      "Re-scan to confirm",
    ],
  },

  // ---------- GDPR (6): 4 pass, 1 watch, 1 fix ----------
  {
    id: "gdpr-a30-01",
    reg: "gdpr",
    ref: "GDPR, Article 30 (Records of processing activities)",
    plain: "Do you know where personal data lives?",
    formal: "A record of processing activities involving personal data is maintained",
    status: "pass",
    why: "1,204 columns are tagged as personal data across 187 tables, and each table is linked to a purpose.",
    ev: [
      ["ownership_tag", "system.information_schema.column_tags", "1,204 columns tagged pii across 187 tables."],
      ["ownership_tag", "system.information_schema.table_tags", "187 of 187 of those tables carry a processing_purpose tag."],
    ],
  },
  {
    id: "gdpr-a5-01",
    reg: "gdpr",
    ref: "GDPR, Article 5(1)(e) (Storage limitation)",
    plain: "Do you delete personal data when you no longer need it?",
    formal: "Personal data is kept no longer than necessary for the purposes of processing",
    status: "fix",
    why: "4 tables with customer data have no retention rule. The oldest record in them is from 2014.",
    ev: [
      ["retention_policy", "system.information_schema.table_tags", "183 of 187 personal-data tables have a retention rule.", "4 tables in the customers catalog have none."],
      ["dq_check", "system.data_quality_monitoring.table_results", "Oldest record in the 4 tables: 2 Feb 2014."],
    ],
    fix: [
      "Agree a retention period for the 4 tables with the data protection officer",
      "Add the retention rule and a deletion job",
      "Re-scan to confirm",
    ],
    owner: "Data platform team and the data protection officer",
  },
  {
    id: "gdpr-a32-01",
    reg: "gdpr",
    ref: "GDPR, Article 32 (Security of processing)",
    plain: "Is personal data hidden from people who don’t need to see it?",
    formal: "Appropriate technical measures ensure a level of security appropriate to the risk",
    status: "pass",
    why: "Every column tagged as personal data is masked. Only 2 approved groups can see the real values.",
    ev: [
      ["access_grant", "system.information_schema.column_masks", "1,204 of 1,204 pii columns have a mask."],
      ["access_grant", "system.information_schema.table_privileges", "2 groups can read unmasked values; both are approved."],
    ],
  },
  {
    id: "gdpr-a17-01",
    reg: "gdpr",
    ref: "GDPR, Article 17 (Right to erasure)",
    plain: "Can you delete one customer’s data when they ask?",
    formal: "Personal data can be erased without undue delay on a valid request",
    status: "watch",
    why: "The deletion job covers 31 of 34 customer tables. 3 newer tables have not been added yet.",
    ev: [
      ["change_record", "system.lakeflow.job_run_timeline", "Erasure job ran 28 times in 90 days, all successful."],
      ["lineage", "system.access.table_lineage", "Erasure job writes to 31 of 34 tables that hold customer IDs."],
    ],
    fix: ["Add the 3 new customer tables to the deletion job", "Re-scan to confirm"],
  },
  {
    id: "gdpr-a25-01",
    reg: "gdpr",
    ref: "GDPR, Article 25 (Data protection by design and by default)",
    plain: "Is test data kept free of real customer details?",
    formal: "Data protection is integrated into processing by design and by default",
    status: "pass",
    why: "The sandbox and test catalogs hold no real personal data. Copies are scrambled on the way in.",
    ev: [
      ["dq_check", "system.data_quality_monitoring.table_results", "0 unmasked pii values found in sandbox and ml_features."],
      ["lineage", "system.access.table_lineage", "All copies into sandbox pass through the masking job."],
    ],
  },
  {
    id: "gdpr-a33-01",
    reg: "gdpr",
    ref: "GDPR, Article 33 (Notification of a personal data breach)",
    plain: "Would you know within 72 hours if personal data leaked?",
    formal: "Personal data breaches can be detected and notified within 72 hours",
    status: "pass",
    why: "Alerts watch for unusual reads and exports of personal data, and the last test alert reached the team in 6 minutes.",
    ev: [
      ["change_record", "SQL Alerts API: /api/2.0/sql/alerts", "Export and bulk-read alerts are active on all pii tables.", "Last alert test: delivered in 6 minutes."],
    ],
  },
];

const evidenceList: Evidence[] = [];
const controlList: Control[] = seeds.map((s) => {
  const evidenceIds = s.ev.map(([type, source, summary, details], i) => {
    const id = `ev-${s.id}-${i + 1}`;
    evidenceList.push({ id, type, source, summary, details: details ?? "", capturedAt: CAPTURED, method: methods[id] });
    return id;
  });
  return {
    id: s.id,
    regulationId: s.reg,
    ref: s.ref,
    plainTitle: s.plain,
    formalTitle: s.formal,
    explanation: s.why,
    status: s.status,
    evidenceIds,
    fixSteps: s.fix ?? [],
    owner: s.owner ?? PLATFORM,
    logic: logic[s.id],
  };
});

export const controls: Control[] = controlList;
export const evidence: Evidence[] = evidenceList;
