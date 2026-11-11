/**
 * The engineer setup guide: what a data platform engineer does once so that
 * Receipts can read from a Databricks workspace with the least access possible.
 * Written for engineers, so it may use technical words. Illustrative for the
 * MVP: validate the grants in a test workspace before relying on them.
 */
export const SERVICE_PRINCIPAL = "receipts-readonly";

export const setupScripts = {
  token: `# Receipts does this for you. Shown so you can see there is no magic.
curl --request POST https://<workspace-host>/oidc/v1/token \\
  --user "<client-id>:<client-secret>" \\
  --data "grant_type=client_credentials&scope=sql"
# → { "access_token": "…", "token_type": "Bearer", "expires_in": 3600 }`,

  systemGrants: `-- Run once as a metastore admin. Logs and metadata about your platform only.
GRANT USE CATALOG ON CATALOG system TO \`${SERVICE_PRINCIPAL}\`;

-- Audit log and lineage
GRANT USE SCHEMA, SELECT ON SCHEMA system.access TO \`${SERVICE_PRINCIPAL}\`;
-- Job runs and schedules
GRANT USE SCHEMA, SELECT ON SCHEMA system.lakeflow TO \`${SERVICE_PRINCIPAL}\`;
-- Results of your data-quality checks
GRANT USE SCHEMA, SELECT ON SCHEMA system.data_quality_monitoring TO \`${SERVICE_PRINCIPAL}\`;`,

  browseGrants: `-- One line per catalog you want in scope. BROWSE shows names, tags and
-- settings. It does NOT allow reading a single row of data.
GRANT BROWSE ON CATALOG risk       TO \`${SERVICE_PRINCIPAL}\`;
GRANT BROWSE ON CATALOG finance    TO \`${SERVICE_PRINCIPAL}\`;
GRANT BROWSE ON CATALOG customers  TO \`${SERVICE_PRINCIPAL}\`;
-- …repeat for each catalog`,

  verify: `-- Run as the service principal to check the result.
SHOW GRANTS \`${SERVICE_PRINCIPAL}\` ON CATALOG system;

SELECT COUNT(*) FROM system.access.audit
WHERE event_date = current_date();          -- should work

SELECT * FROM customers.crm.dim_prospects LIMIT 1;
-- should FAIL: the principal has no SELECT on your data`,

  revoke: `-- Switch Receipts off at any time.
REVOKE USE CATALOG ON CATALOG system FROM \`${SERVICE_PRINCIPAL}\`;
-- …or simply delete the service principal's OAuth secret.`,
};

export const setupGuide = {
  title: "Connect Receipts to Databricks",
  subtitle: "A guide for the data platform engineer. One-time setup, about 15 minutes.",
  sampleNote:
    "This guide belongs to a product demo. The steps follow the Databricks documentation, but check the grants in a test workspace before using them for real.",
  how: {
    title: "How Receipts talks to your workspace",
    body: "Receipts calls your workspace from the outside. Nothing is installed in it. It signs in as a service principal you create, which is a login for software, not for a person.",
    flow: [
      { name: "Sign in", body: "Receipts swaps the client ID and secret for an access token that lasts one hour (OAuth, machine to machine)." },
      { name: "Ask", body: "It sends read-only SQL to a SQL warehouse you choose, and a few read-only REST calls." },
      { name: "Keep the answer", body: "It stores the result of each check (counts, names, timestamps) as evidence. Your business data is never read." },
    ],
    channels: [
      {
        name: "SQL on system tables",
        via: "Statement Execution API · POST /api/2.0/sql/statements",
        used: "Most checks: audit log, lineage, tags, masks, job runs.",
      },
      {
        name: "Workspace REST APIs",
        via: "SCIM groups, Jobs, Unity Catalog tables, SQL alerts (GET only)",
        used: "Current state the tables don’t hold, such as who is an admin today.",
      },
      {
        name: "Code host (optional)",
        via: "A read-only GitHub or GitLab app",
        used: "Pull-request approvals and policy history.",
      },
    ],
  },
  stepsTitle: "What you need to do",
  steps: [
    {
      title: "Check that system tables are on",
      body: "An account admin enables the system schemas once per metastore. Receipts needs access, lakeflow and data_quality_monitoring. The access schema holds the audit log and lineage.",
    },
    {
      title: "Create a service principal",
      body: `In workspace settings, open Identity and access, then Service principals, and add one called ${SERVICE_PRINCIPAL}. Give it the “Databricks SQL access” entitlement and nothing else. Do not make it an admin.`,
    },
    {
      title: "Create an OAuth secret",
      body: "On the service principal, open Secrets and generate one. Pick a lifetime that matches your rotation policy (the maximum is 730 days) and restrict it to the scopes it needs rather than “all APIs”. Copy the client ID and the secret: the secret is shown only once.",
      script: "token" as const,
      scriptLabel: "Token exchange",
    },
    {
      title: "Give it a SQL warehouse",
      body: "Pick a small serverless SQL warehouse (or create one that stops after a few idle minutes) and give the service principal “Can use”. A scan runs a few dozen short queries.",
    },
    {
      title: "Grant read access to the system tables",
      body: "System tables need three grants: USE CATALOG on system, then USE SCHEMA and SELECT on each schema.",
      script: "systemGrants" as const,
      scriptLabel: "System table grants",
    },
    {
      title: "Let it see your catalogs, without the data",
      body: "The information schema only lists objects a principal is allowed to see. BROWSE makes your tables, tags, masks and grants visible as metadata, with no access to the data inside.",
      script: "browseGrants" as const,
      scriptLabel: "Metadata-only grants",
    },
    {
      title: "Check it, then hand over the details",
      body: "Confirm the principal can read the audit log and cannot read your data. Then paste the workspace address, client ID and secret into Receipts, or send them to your compliance colleague through your password manager.",
      script: "verify" as const,
      scriptLabel: "Verify",
    },
  ],
  permissions: {
    title: "Every permission, and why",
    cols: { what: "Permission", why: "Why Receipts needs it", allows: "What it does not allow" },
    rows: [
      {
        what: "“Databricks SQL access” entitlement",
        why: "To run queries on a SQL warehouse.",
        allows: "No notebooks, clusters or workspace files.",
      },
      { what: "“Can use” on one SQL warehouse", why: "Somewhere to run the read-only SQL.", allows: "Cannot change or stop the warehouse." },
      {
        what: "USE CATALOG on system; USE SCHEMA + SELECT on system.access",
        why: "Audit log (who did what) and lineage (where data came from).",
        allows: "System tables are read-only for everyone.",
      },
      {
        what: "USE SCHEMA + SELECT on system.lakeflow",
        why: "Job runs: failures, lateness, deletion jobs.",
        allows: "Cannot run, edit or cancel a job.",
      },
      {
        what: "USE SCHEMA + SELECT on system.data_quality_monitoring",
        why: "Results of your quality checks, so Receipts never has to read the data itself.",
        allows: "Sees pass/fail results only.",
      },
      {
        what: "BROWSE on each catalog in scope",
        why: "Names, tags, owners, masks and grants, through the information schema.",
        allows: "Cannot read, change or export a single row.",
      },
      {
        what: "“Can view” on production jobs (optional)",
        why: "To confirm jobs run from a protected branch.",
        allows: "Cannot run or edit them.",
      },
    ],
  },
  never: {
    title: "What Receipts never gets",
    items: [
      "SELECT on your business tables",
      "MODIFY, CREATE or any write privilege",
      "Workspace admin, account admin or metastore admin",
      "Permission to start clusters or run notebooks",
      "Personal access tokens or anyone’s password",
    ],
  },
  extras: {
    title: "Good to know",
    items: [
      { title: "IP access lists", body: "If your workspace restricts inbound traffic, allow the Receipts addresses shown in the app, or ask us about a private connection." },
      { title: "Verbose audit logs", body: "Two checks look at the text of SQL statements. That text is only logged when verbose audit logs are switched on. Without it, those checks report “not enough evidence” instead of guessing." },
      { title: "Several workspaces", body: "Audit logs cover every workspace in the region. Add the service principal to each workspace you want scanned so the REST checks work there too." },
      { title: "Group membership", body: "The admin-count check reads the members of the workspace admins group. If your workspace hides group members from non-admins, a workspace admin shares that one group with the service principal." },
      { title: "Rotating or removing access", body: "Generate a new secret and paste it into Receipts settings. To switch Receipts off, delete the secret or revoke the grants." },
    ],
    scriptLabel: "Remove access",
  },
  done: { title: "All set?", body: "Paste the three details into the Connect step and press Test connection.", cta: "Start free trial", back: "Back to the app" },
  copyLabel: "Copy",
  copied: "Copied to your clipboard",
};
