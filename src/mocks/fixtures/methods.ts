import type { ControlLogic, EvidenceMethod } from "../types";

/**
 * How each answer was reached: the read-only query or API call behind every
 * piece of evidence, a mocked sample of what came back, and the rule that
 * turns the evidence into a status.
 *
 * SAMPLE CONTENT. Queries are written against real Databricks system tables
 * and REST endpoints (for example system.access.audit), but the tag names,
 * thresholds and rows are illustrative.
 */
const sql = (query: string, columns: string[], rows: string[][], reading: string, extra: Partial<EvidenceMethod> = {}): EvidenceMethod => ({
  via: "sql",
  query: query.trim(),
  columns,
  rows,
  reading,
  ...extra,
});
const rest = (query: string, columns: string[], rows: string[][], reading: string, extra: Partial<EvidenceMethod> = {}): EvidenceMethod => ({
  ...sql(query, columns, rows, reading, extra),
  via: "rest",
});
const git = (query: string, columns: string[], rows: string[][], reading: string, extra: Partial<EvidenceMethod> = {}): EvidenceMethod => ({
  ...sql(query, columns, rows, reading, extra),
  via: "git",
});

/** Keyed by evidence id: ev-<control id>-<n>. */
export const methods: Record<string, EvidenceMethod> = {
  // ---------------- DORA ----------------
  "ev-dora-a8-01-1": sql(
    `
SELECT c.catalog_name, t.tag_value AS business_service
FROM system.information_schema.catalogs c
LEFT JOIN system.information_schema.catalog_tags t
  ON t.catalog_name = c.catalog_name
 AND t.tag_name = '{{tag.businessService}}'
WHERE c.catalog_name NOT IN ('system', 'samples')
ORDER BY c.catalog_name`,
    ["catalog_name", "business_service"],
    [
      ["analytics", "Group analytics"],
      ["compliance", "Compliance reporting"],
      ["customers", "Retail banking"],
    ],
    "14 rows came back and none has an empty business_service.",
    { more: 11 },
  ),
  "ev-dora-a8-01-2": sql(
    `
SELECT COUNT(DISTINCT target_table_full_name) AS tables_with_upstream
FROM system.access.table_lineage
WHERE event_date >= current_date() - INTERVAL 90 DAYS
  AND source_table_full_name IS NOT NULL`,
    ["tables_with_upstream"],
    [["2318"]],
    "2,318 tables have at least one recorded upstream source in the last 90 days.",
  ),
  "ev-dora-a8-02-1": sql(
    `
SELECT c.catalog_name,
       COUNT(*)             AS critical_tables,
       COUNT(o.tag_value)   AS with_owner
FROM system.information_schema.table_tags c
LEFT JOIN system.information_schema.table_tags o
  ON  o.catalog_name = c.catalog_name
  AND o.schema_name  = c.schema_name
  AND o.table_name   = c.table_name
  AND o.tag_name     = '{{tag.owner}}'
WHERE c.tag_name = '{{tag.criticality}}' AND c.tag_value = '{{tag.criticality.value}}'
GROUP BY c.catalog_name
HAVING COUNT(*) > COUNT(o.tag_value)`,
    ["catalog_name", "critical_tables", "with_owner"],
    [["treasury_sandbox", "24", "0"]],
    "Only one catalog has critical tables without an owner tag: 24 tables in treasury_sandbox. Across all catalogs, 212 of 236 are tagged.",
  ),
  "ev-dora-a9-01-1": sql(
    `
SELECT p.grantee, COUNT(*) AS direct_grants
FROM system.information_schema.table_privileges p
JOIN system.information_schema.table_tags s
  ON  s.catalog_name = p.table_catalog
  AND s.schema_name  = p.table_schema
  AND s.table_name   = p.table_name
  AND s.tag_name = '{{tag.sensitivity}}' AND s.tag_value = '{{tag.sensitivity.value}}'
WHERE p.grantee LIKE '%@%'        -- a person, not a group
GROUP BY p.grantee`,
    ["grantee", "direct_grants"],
    [],
    "No rows: nobody holds a personal grant on a sensitive table. The same query without the person filter counts 1,946 grants, all to groups.",
  ),
  "ev-dora-a9-01-2": sql(
    `
SELECT identity_metadata.run_by AS changed_by,
       COUNT(*)                 AS grant_changes,
       COUNT_IF(request_params.comment IS NULL) AS without_ticket
FROM system.access.audit
WHERE service_name = 'unityCatalog'
  AND action_name  = 'updatePermissions'
  AND event_date  >= current_date() - INTERVAL 90 DAYS
GROUP BY 1`,
    ["changed_by", "grant_changes", "without_ticket"],
    [["svc-access-requests@nordlys.example", "214", "0"]],
    "All 214 permission changes were made by the access-request workflow, and each one carries the ticket of the person who approved it.",
  ),
  "ev-dora-a9-02-1": rest(
    `
GET https://adb-7402115509.12.azuredatabricks.net
    /api/2.0/preview/scim/v2/Groups
    ?filter=displayName eq "admins"
    &attributes=displayName,members`,
    ["member", "type"],
    [
      ["anders.lie@nordlys.example", "User"],
      ["mette.dahl@nordlys.example", "User"],
      ["svc-terraform@nordlys.example", "ServicePrincipal"],
      ["jonas.vik@nordlys.example", "User"],
    ],
    "The workspace admins group has 11 members. Your access policy (v3.2), entered in Receipts settings, allows 4.",
    {
      more: 7,
      note: "The audit log shows changes over time (setAdmin, removeAdmin, addPrincipalToGroup). The list of who is an admin right now comes from the identity API.",
    },
  ),
  "ev-dora-a9-02-2": sql(
    `
SELECT request_params.user AS admin,
       MAX(event_date)     AS last_login
FROM system.access.audit
WHERE service_name = 'accounts'
  AND action_name IN ('login', 'samlLogin', 'tokenLogin', 'jwtLogin')
  AND workspace_id = '7402115509'
  AND request_params.user IN (:admin_members)   -- the 11 from step 1
GROUP BY 1
HAVING MAX(event_date) < current_date() - INTERVAL 90 DAYS`,
    ["admin", "last_login"],
    [
      ["erik.moe@nordlys.example", "2026-06-18"],
      ["old-contractor@nordlys.example", "2026-03-02"],
      ["svc-migration-2024@nordlys.example", "2026-01-27"],
    ],
    "3 of the 11 admin accounts have not logged in for more than 90 days.",
  ),
  "ev-dora-a9-03-1": git(
    `
GET https://api.github.com/repos/nordlys/lakehouse-pipelines
    /pulls?state=closed&base=main&per_page=100      (merged in last 90 days)
GET .../pulls/{number}/reviews                       (for each pull request)
GET .../branches/main/protection`,
    ["merged_pull_requests", "with_approval", "required_approvals_on_main"],
    [["312", "312", "1"]],
    "Every one of the 312 merged pull requests has at least one approving review, and main is protected so that cannot be skipped.",
  ),
  "ev-dora-a9-03-2": rest(
    `
GET https://adb-7402115509.12.azuredatabricks.net
    /api/2.2/jobs/list?expand_tasks=true
-- then read git_source.git_branch for each production job`,
    ["production_jobs", "running_from_main", "other_branches"],
    [["86", "86", "0"]],
    "All 86 production jobs take their code from the protected main branch.",
  ),
  "ev-dora-a10-01-1": sql(
    `
SELECT workspace_id,
       MIN(event_date) AS oldest_event,
       MAX(event_time) AS newest_event,
       COUNT(*)        AS events
FROM system.access.audit
WHERE event_date >= current_date() - INTERVAL 365 DAYS
GROUP BY workspace_id`,
    ["workspace_id", "oldest_event", "newest_event", "events"],
    [
      ["7402115509", "2025-11-10", "2026-11-10 06:08", "48211930"],
      ["7402118834", "2025-11-10", "2026-11-10 06:07", "9120444"],
      ["0", "2025-11-10", "2026-11-10 05:51", "310872"],
    ],
    "Both workspaces (and the account, shown as workspace 0) have a full year of events, and the newest is 4 minutes older than the scan.",
  ),
  "ev-dora-a11-01-1": rest(
    `
GET /api/2.1/unity-catalog/tables?catalog_name={catalog}&schema_name={schema}
-- for every schema; read properties["delta.deletedFileRetentionDuration"]
-- and report the lowest value per catalog`,
    ["catalog", "history_kept"],
    [
      ["analytics", "7 days"],
      ["sandbox", "7 days"],
      ["treasury_sandbox", "7 days"],
      ["reporting", "7 days"],
      ["ml_features", "7 days"],
    ],
    "5 catalogs keep 7 days of history. The other 9 keep 30 days, which is what your backup policy asks for.",
    { more: 9 },
  ),
  "ev-dora-a12-01-1": git(
    `
GET https://api.github.com/repos/nordlys/platform-runbooks
    /commits?path=restore-tests&per_page=1`,
    ["file", "committed"],
    [["restore-tests/2025-09-03-prod-risk-catalog.md", "2025-09-03"]],
    "The newest restore test record is from 3 September 2025, 14 months before this scan. Your policy asks for one every 12 months.",
  ),
  "ev-dora-a17-01-1": sql(
    `
SELECT r.job_id, r.run_id, r.result_state, r.period_end_time
FROM system.lakeflow.job_run_timeline r
JOIN system.lakeflow.jobs j USING (workspace_id, job_id)
WHERE j.tags['env'] = 'prod'
  AND r.result_state IN ('FAILED', 'TIMED_OUT')
  AND r.period_end_time >= current_date() - INTERVAL 90 DAYS`,
    ["job_id", "run_id", "result_state", "period_end_time"],
    [
      ["5512", "880134", "FAILED", "2026-11-03 04:12"],
      ["5512", "871902", "FAILED", "2026-10-21 04:09"],
      ["6120", "866455", "TIMED_OUT", "2026-10-14 02:40"],
    ],
    "41 failed production runs. Each run_id was then looked up in your ticketing tool: 41 of 41 have a closed incident with a cause.",
    { more: 38 },
  ),
  "ev-dora-a28-01-1": sql(
    `
SELECT recipient_name, authentication_type, created
FROM system.information_schema.recipients
ORDER BY created`,
    ["recipient_name", "authentication_type", "created"],
    [
      ["regulator_reporting", "TOKEN", "2024-02-11"],
      ["credit_bureau", "TOKEN", "2024-09-30"],
      ["external_audit_partner", "DATABRICKS", "2025-05-06"],
    ],
    "3 outside recipients. Each name matches an entry in the supplier register you uploaded, and their shares are read-only.",
  ),
  "ev-dora-a28-01-2": sql(
    `
SELECT external_location_name, url
FROM system.information_schema.external_locations`,
    ["external_location_name", "url"],
    [
      ["prod_raw", "abfss://raw@nordlysprodne.dfs.core.windows.net/"],
      ["prod_curated", "abfss://curated@nordlysprodne.dfs.core.windows.net/"],
      ["analytics_lake", "abfss://lake@nordlysanalyticswe.dfs.core.windows.net/"],
    ],
    "6 storage locations. Their storage accounts are in Norway East and West Europe, both inside the EU/EEA.",
    { more: 3 },
  ),

  // ---------------- BCBS 239 ----------------
  "ev-bcbs-p1-01-1": sql(
    `
SELECT catalog_name, tag_value AS accountable_executive
FROM system.information_schema.catalog_tags
WHERE tag_name = 'accountable_executive'
  AND catalog_name IN ('risk', 'finance', 'treasury')`,
    ["catalog_name", "accountable_executive"],
    [
      ["risk", "Chief Risk Officer"],
      ["finance", "Chief Financial Officer"],
      ["treasury", "Group Treasurer"],
    ],
    "All 3 risk-related catalogs name a senior person who answers for them.",
  ),
  "ev-bcbs-p1-01-2": git(
    `
GET https://api.github.com/repos/nordlys/data-policies
    /commits?path=risk-data-policy.md&per_page=1
GET .../pulls/{number}/reviews`,
    ["version", "merged", "approved_by"],
    [["v4.1", "2026-03-12", "Chief Risk Officer"]],
    "The current risk data policy is version 4.1, approved on 12 March 2026.",
  ),
  "ev-bcbs-p2-01-1": sql(
    `
SELECT catalog_name, COUNT(*) AS regulatory_risk_tables
FROM system.information_schema.table_tags
WHERE tag_name = 'regulatory_report' AND tag_value = 'bcbs239'
GROUP BY catalog_name`,
    ["catalog_name", "regulatory_risk_tables"],
    [["risk", "41"]],
    "All 41 tables tagged for BCBS 239 reporting live in one catalog: risk.",
  ),
  "ev-bcbs-p2-01-2": sql(
    `
SELECT table_schema, table_name
FROM system.information_schema.tables
WHERE table_catalog = 'risk'
  AND NOT table_name RLIKE '^(fct|dim|agg|ref)_[a-z0-9_]+$'`,
    ["table_schema", "table_name"],
    [],
    "No rows: every table in the risk catalog follows the naming standard.",
  ),
  "ev-bcbs-p3-01-1": sql(
    `
SELECT t.table_name,
       COUNT(DISTINCT l.source_table_full_name) AS upstream_sources
FROM system.information_schema.tables t
LEFT JOIN system.access.table_lineage l
  ON  l.target_table_full_name = concat_ws('.', t.table_catalog, t.table_schema, t.table_name)
  AND l.event_date >= current_date() - INTERVAL 90 DAYS
WHERE t.table_catalog = 'risk' AND t.table_schema = 'regulatory'
GROUP BY t.table_name
ORDER BY upstream_sources`,
    ["table_name", "upstream_sources"],
    [
      ["agg_manual_overrides", "0"],
      ["fct_counterparty_fix", "0"],
      ["fct_collateral_patch", "0"],
      ["agg_liquidity_coverage", "9"],
      ["fct_credit_exposure", "14"],
    ],
    "41 tables. 38 have at least one upstream source, 3 have none.",
    { more: 36 },
  ),
  "ev-bcbs-p3-01-2": sql(
    `
SELECT target_table_full_name, entity_type, created_by
FROM system.access.table_lineage
WHERE target_table_full_name IN (:three_tables)
  AND event_date >= current_date() - INTERVAL 90 DAYS
GROUP BY ALL`,
    ["target_table_full_name", "entity_type", "created_by"],
    [
      ["risk.regulatory.agg_manual_overrides", "NOTEBOOK", "sofie.berg@nordlys.example"],
      ["risk.regulatory.fct_counterparty_fix", "NOTEBOOK", "sofie.berg@nordlys.example"],
      ["risk.regulatory.fct_collateral_patch", "NOTEBOOK", "henrik.aas@nordlys.example"],
    ],
    "The only thing that writes to the 3 tables is a notebook run by a person. Nothing upstream is linked.",
  ),
  "ev-bcbs-p3-01-3": sql(
    `
SELECT COUNT(*) AS scheduled_writes
FROM system.access.table_lineage l
JOIN system.lakeflow.job_run_timeline r
  ON r.run_id = l.entity_run_id
WHERE l.entity_type = 'JOB'
  AND l.target_table_full_name IN (:three_tables)
  AND l.event_date >= current_date() - INTERVAL 90 DAYS`,
    ["scheduled_writes"],
    [["0"]],
    "No scheduled job has written to these 3 tables in 90 days.",
  ),
  "ev-bcbs-p3-02-1": sql(
    `
SELECT status, COUNT(*) AS checks
FROM system.data_quality_monitoring.table_results
WHERE catalog_name = 'risk'
  AND event_time >= current_date() - INTERVAL 1 DAY
GROUP BY status`,
    ["status", "checks"],
    [
      ["Healthy", "127"],
      ["Warning", "1"],
    ],
    "128 checks ran in the last day: 127 healthy, 1 warning (reviewed). Over 30 days the pass rate is 99.2%.",
  ),
  "ev-bcbs-p4-01-1": sql(
    `
SELECT DATE(event_time) AS run_date, status
FROM system.data_quality_monitoring.table_results
WHERE table_name = 'fct_group_exposure'
  AND check_name = 'all_legal_entities_present'   -- expects 9
  AND event_time >= current_date() - INTERVAL 90 DAYS
  AND status <> 'Healthy'`,
    ["run_date", "status"],
    [],
    "No rows: the completeness check passed on each of the last 90 days. Receipts reads the result of the check, never the exposure data itself.",
  ),
  "ev-bcbs-p5-01-1": sql(
    `
SELECT DATE(r.period_end_time) AS run_date,
       date_format(r.period_end_time, 'HH:mm') AS finished
FROM system.lakeflow.job_run_timeline r
JOIN system.lakeflow.jobs j USING (workspace_id, job_id)
WHERE j.name = 'risk_daily_load'
  AND r.result_state = 'SUCCEEDED'
  AND r.period_end_time >= current_date() - INTERVAL 90 DAYS
  AND date_format(r.period_end_time, 'HH:mm') > '06:00'
ORDER BY finished DESC`,
    ["run_date", "finished"],
    [
      ["2026-09-29", "08:47"],
      ["2026-10-13", "07:31"],
      ["2026-11-02", "06:52"],
    ],
    "6 of the 90 daily runs finished after the 06:00 deadline. The latest was 08:47.",
    { more: 3 },
  ),
  "ev-bcbs-p6-01-1": sql(
    `
SELECT column_name, data_type
FROM system.information_schema.columns
WHERE table_catalog = 'risk'
  AND table_name = 'fct_group_exposure'
  AND column_name IN ('legal_entity_id', 'country_code', 'product_code', 'counterparty_id')`,
    ["column_name", "data_type"],
    [
      ["legal_entity_id", "STRING"],
      ["country_code", "STRING"],
      ["product_code", "STRING"],
      ["counterparty_id", "STRING"],
    ],
    "All 4 reporting dimensions exist on the group exposure table, so new cuts need no engineering work.",
  ),
  "ev-bcbs-p7-01-1": sql(
    `
SELECT user_identity.email AS who,
       COUNT(*)            AS manual_statements
FROM system.access.audit
WHERE service_name = 'databrickssql'
  AND action_name  = 'commandSubmit'
  AND event_date  >= current_date() - INTERVAL 90 DAYS
  AND request_params.commandText
      RLIKE '(?i)^\\s*(UPDATE|DELETE FROM|MERGE INTO)\\s+risk\\.board\\.'
GROUP BY 1`,
    ["who", "manual_statements"],
    [
      ["sofie.berg@nordlys.example", "11"],
      ["henrik.aas@nordlys.example", "6"],
    ],
    "17 hand-written change statements against 2 board report tables, by 2 people, in 90 days.",
    { note: "commandSubmit and its commandText are only recorded when verbose audit logs are switched on for the workspace." },
  ),
  "ev-bcbs-p7-01-2": sql(
    `
SELECT target_table_full_name,
       array_sort(collect_set(entity_type)) AS written_by
FROM system.access.table_lineage
WHERE {{scope:board:target_table_full_name}}
  AND event_date >= current_date() - INTERVAL 90 DAYS
GROUP BY 1`,
    ["target_table_full_name", "written_by"],
    [
      ["risk.board.agg_capital_ratios", "[JOB]"],
      ["risk.board.agg_large_exposures", "[JOB, DBSQL_QUERY]"],
      ["risk.board.agg_liquidity_summary", "[JOB, DBSQL_QUERY]"],
    ],
    "10 of the 12 board tables are written only by scheduled jobs. 2 are also written from the SQL editor.",
    { more: 9 },
  ),

  // ---------------- GDPR ----------------
  "ev-gdpr-a30-01-1": sql(
    `
SELECT COUNT(*) AS pii_columns,
       COUNT(DISTINCT concat_ws('.', catalog_name, schema_name, table_name)) AS tables
FROM system.information_schema.column_tags
WHERE tag_name = '{{tag.pii}}'`,
    ["pii_columns", "tables"],
    [["1204", "187"]],
    "1,204 columns are tagged as personal data, across 187 tables.",
  ),
  "ev-gdpr-a30-01-2": sql(
    `
SELECT COUNT(*) AS pii_tables,
       COUNT(p.tag_value) AS with_purpose
FROM (SELECT DISTINCT catalog_name, schema_name, table_name
      FROM system.information_schema.column_tags WHERE tag_name = '{{tag.pii}}') t
LEFT JOIN system.information_schema.table_tags p
  USING (catalog_name, schema_name, table_name)
WHERE p.tag_name = '{{tag.purpose}}' OR p.tag_name IS NULL`,
    ["pii_tables", "with_purpose"],
    [["187", "187"]],
    "Every one of the 187 tables with personal data states why the data is processed.",
  ),
  "ev-gdpr-a5-01-1": sql(
    `
SELECT t.catalog_name, t.schema_name, t.table_name
FROM (SELECT DISTINCT catalog_name, schema_name, table_name
      FROM system.information_schema.column_tags WHERE tag_name = '{{tag.pii}}') t
LEFT ANTI JOIN system.information_schema.table_tags r
  ON  r.catalog_name = t.catalog_name AND r.schema_name = t.schema_name
  AND r.table_name   = t.table_name   AND r.tag_name    = '{{tag.retention}}'`,
    ["catalog_name", "schema_name", "table_name"],
    [
      ["customers", "legacy", "dim_customer_2014_import"],
      ["customers", "legacy", "fct_branch_visits"],
      ["customers", "crm", "fct_campaign_contacts"],
      ["customers", "crm", "dim_prospects"],
    ],
    "4 tables with personal data have no retention rule. The other 183 do.",
  ),
  "ev-gdpr-a5-01-2": sql(
    `
SELECT table_name, MIN(downstream_impact.oldest_record_date) AS oldest_record
FROM system.data_quality_monitoring.table_results
WHERE catalog_name = 'customers'
  AND table_name IN (:four_tables)
  AND check_name = 'record_age'
GROUP BY table_name`,
    ["table_name", "oldest_record"],
    [
      ["dim_customer_2014_import", "2014-02-02"],
      ["fct_branch_visits", "2016-08-19"],
      ["fct_campaign_contacts", "2019-01-07"],
      ["dim_prospects", "2020-11-23"],
    ],
    "The oldest record in the 4 tables is from 2 February 2014. Receipts reads the age check's result, not the customer rows.",
  ),
  "ev-gdpr-a32-01-1": sql(
    `
SELECT t.catalog_name, t.schema_name, t.table_name, t.column_name
FROM system.information_schema.column_tags t
LEFT ANTI JOIN system.information_schema.column_masks m
  ON  m.table_catalog = t.catalog_name AND m.table_schema = t.schema_name
  AND m.table_name    = t.table_name   AND m.column_name  = t.column_name
WHERE t.tag_name = '{{tag.pii}}'`,
    ["catalog_name", "schema_name", "table_name", "column_name"],
    [],
    "No rows: all 1,204 columns tagged as personal data have a mask.",
  ),
  "ev-gdpr-a32-01-2": sql(
    `
SELECT DISTINCT m.mask_name, r.routine_definition
FROM system.information_schema.column_masks m
JOIN system.information_schema.routines r
  ON concat_ws('.', r.routine_catalog, r.routine_schema, r.routine_name) = m.mask_name`,
    ["mask_name", "shows_real_value_to"],
    [
      ["governance.masks.pii_mask", "is_account_group_member('pii_readers')"],
      ["governance.masks.pii_mask_fraud", "is_account_group_member('fraud_investigations')"],
    ],
    "Only 2 groups can see unmasked values. Both are on your approved list.",
  ),
  "ev-gdpr-a17-01-1": sql(
    `
SELECT r.result_state, COUNT(*) AS runs
FROM system.lakeflow.job_run_timeline r
JOIN system.lakeflow.jobs j USING (workspace_id, job_id)
WHERE j.name = 'gdpr_erasure_requests'
  AND r.period_end_time >= current_date() - INTERVAL 90 DAYS
GROUP BY r.result_state`,
    ["result_state", "runs"],
    [["SUCCEEDED", "28"]],
    "The deletion job ran 28 times in 90 days and never failed.",
  ),
  "ev-gdpr-a17-01-2": sql(
    `
SELECT c.table_schema, c.table_name
FROM system.information_schema.columns c
LEFT ANTI JOIN (
  SELECT DISTINCT target_table_full_name
  FROM system.access.table_lineage
  WHERE entity_type = 'JOB' AND entity_id = :erasure_job_id
) l ON l.target_table_full_name = concat_ws('.', c.table_catalog, c.table_schema, c.table_name)
WHERE c.table_catalog = 'customers' AND c.column_name = 'customer_id'`,
    ["table_schema", "table_name"],
    [
      ["onboarding", "fct_kyc_documents"],
      ["onboarding", "fct_video_ident_sessions"],
      ["crm", "fct_chat_transcripts"],
    ],
    "34 tables hold a customer ID. The deletion job writes to 31 of them. These 3 newer tables are not covered yet.",
  ),
  "ev-gdpr-a25-01-1": sql(
    `
SELECT catalog_name, COUNT(*) AS unmasked_pii_findings
FROM system.data_quality_monitoring.table_results
WHERE catalog_name IN ('sandbox', 'ml_features')
  AND check_name = 'pii_pattern_scan'
  AND status <> 'Healthy'
GROUP BY catalog_name`,
    ["catalog_name", "unmasked_pii_findings"],
    [],
    "No rows: the personal-data scanner found nothing unmasked in the test catalogs.",
  ),
  "ev-gdpr-a25-01-2": sql(
    `
SELECT target_table_full_name, entity_type, entity_id
FROM system.access.table_lineage
WHERE {{scope:test:target_table_full_name}}
  AND {{scope:personal:source_table_full_name}}
  AND NOT (entity_type = 'JOB' AND entity_id = :masking_job_id)
  AND event_date >= current_date() - INTERVAL 90 DAYS`,
    ["target_table_full_name", "entity_type", "entity_id"],
    [],
    "No rows: nothing copies customer data into the sandbox except the masking job.",
  ),
  "ev-gdpr-a33-01-1": rest(
    `
GET https://adb-7402115509.12.azuredatabricks.net/api/2.0/sql/alerts
-- keep alerts whose query reads system.access.audit for
-- unityCatalog generateTemporaryTableCredential / deltaSharingQueryTable
-- on tables tagged pii`,
    ["alert", "state", "last_test_delivered_in"],
    [
      ["PII bulk read over 100k rows", "OK", "6 minutes"],
      ["PII export to external location", "OK", "6 minutes"],
    ],
    "2 alerts watch for unusual reads and exports of personal data. The last test alert reached the security channel in 6 minutes, well inside 72 hours.",
  ),
};

/** Keyed by control id: the rule that turns evidence into one of the three statuses. */
export const logic: Record<string, ControlLogic> = {
  "dora-a8-01": {
    rule: "Looks good when every catalog is registered and linked to a business service. Needs fixing when any catalog is unknown.",
    result: "14 of 14 catalogs are linked to a business service.",
  },
  "dora-a8-02": {
    rule: "Looks good at 100% of critical tables with an owner. Keep an eye on it from 85% to 99%. Needs fixing below 85%.",
    result: "212 of 236 is 90%, so it sits in the middle band.",
  },
  "dora-a9-01": {
    rule: "Looks good when no person holds a direct grant on a sensitive table and every grant change has an approver.",
    result: "0 personal grants and 0 changes without an approval ticket.",
  },
  "dora-a9-02": {
    rule: "Looks good when the number of admins is at or under your policy limit and none is inactive. Keep an eye on it when it is over by 1 or 2. Needs fixing when it is over by more, or when inactive admins exist.",
    result: "11 admins against a limit of 4 (7 over), and 3 are inactive.",
  },
  "dora-a9-03": {
    rule: "Looks good when 100% of production changes were approved by a second person and the main branch is protected.",
    result: "312 of 312 changes approved; all 86 production jobs run from main.",
  },
  "dora-a10-01": {
    rule: "Looks good when audit logs are on for every workspace, kept for at least 365 days, and fresh within the last hour.",
    result: "Both workspaces have 365 days of logs and the newest event is 4 minutes old.",
  },
  "dora-a11-01": {
    rule: "Looks good when every catalog keeps the history your policy asks for (30 days). Keep an eye on it when some fall short. Needs fixing when a production catalog falls short.",
    result: "5 non-production catalogs keep 7 days. All 9 production catalogs keep 30.",
  },
  "dora-a12-01": {
    rule: "Looks good when a restore test was recorded in the last 12 months. Keep an eye on it up to 18 months. Needs fixing after that.",
    result: "The last test was 14 months ago.",
  },
  "dora-a17-01": {
    rule: "Looks good when every failed production run has a closed incident ticket with a cause.",
    result: "41 failed runs, 41 closed tickets.",
  },
  "dora-a28-01": {
    rule: "Looks good when every outside recipient is on your supplier register and all storage is inside the EU/EEA.",
    result: "3 of 3 recipients matched; 6 of 6 storage locations in the EU/EEA.",
  },
  "bcbs-p1-01": {
    rule: "Looks good when each risk catalog names an accountable senior person and the risk data policy was approved in the last 12 months.",
    result: "3 of 3 catalogs named; policy v4.1 approved 8 months ago.",
  },
  "bcbs-p2-01": {
    rule: "Looks good when all regulatory risk tables sit in the agreed catalog and follow the naming standard.",
    result: "41 of 41 tables in the risk catalog; 0 naming breaks.",
  },
  "bcbs-p3-01": {
    rule: "Looks good when 100% of risk tables trace back to source. Keep an eye on it from 90% to 99%. Needs fixing below 90%.",
    result: "38 of 41 is 93%, so it sits in the middle band.",
  },
  "bcbs-p3-02": {
    rule: "Looks good when automatic checks cover the risk tables and at least 98% passed over 30 days, with every warning reviewed.",
    result: "128 checks, 99.2% passing, 1 warning reviewed.",
  },
  "bcbs-p4-01": {
    rule: "Looks good when the completeness check passed on every one of the last 90 days.",
    result: "90 of 90 days passed.",
  },
  "bcbs-p5-01": {
    rule: "Looks good when at least 98% of daily loads met the deadline. Keep an eye on it from 90% to 97%. Needs fixing below 90%.",
    result: "84 of 90 is 93%, so it sits in the middle band.",
  },
  "bcbs-p6-01": {
    rule: "Looks good when the group exposure table carries all 4 dimensions regulators ask for.",
    result: "4 of 4 dimensions found.",
  },
  "bcbs-p7-01": {
    rule: "Looks good when board report tables are written only by scheduled, logged jobs. Needs fixing when anyone edits one by hand.",
    result: "2 of 12 tables were edited by hand, 17 times in 90 days.",
  },
  "gdpr-a30-01": {
    rule: "Looks good when personal data is tagged and every table that holds it states a purpose.",
    result: "187 of 187 tables state a purpose.",
  },
  "gdpr-a5-01": {
    rule: "Looks good when every table with personal data has a retention rule. Needs fixing when any has none.",
    result: "4 of 187 tables have no retention rule, and one holds data from 2014.",
  },
  "gdpr-a32-01": {
    rule: "Looks good when every personal-data column is masked and only approved groups can see real values.",
    result: "1,204 of 1,204 columns masked; 2 approved groups.",
  },
  "gdpr-a17-01": {
    rule: "Looks good when the deletion job covers every table that holds a customer ID. Keep an eye on it from 90% to 99%. Needs fixing below 90%.",
    result: "31 of 34 is 91%, so it sits in the middle band.",
  },
  "gdpr-a25-01": {
    rule: "Looks good when no unmasked personal data is found in test catalogs and every copy goes through the masking job.",
    result: "0 findings and 0 unmasked copies.",
  },
  "gdpr-a33-01": {
    rule: "Looks good when alerts watch reads and exports of personal data and a test alert arrived well within 72 hours.",
    result: "2 alerts active; last test delivered in 6 minutes.",
  },
};
