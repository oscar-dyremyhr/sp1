# Ideation: adding Snowflake and Microsoft Fabric

**Status:** brainstorm, not a plan. Nothing here is built.
**Caveat:** the Databricks side was checked against its documentation. The Snowflake and Fabric object names below are from working knowledge and were **not** verified against vendor docs. Treat each as "confirm before building".

## The idea in one paragraph

Receipts on Databricks does three things: it signs in with a read-only machine identity, it reads **logs and metadata about the platform** (never business rows), and it maps what it finds to controls using the customer's **Data map**. None of that is Databricks-specific. If every check is written as an *intent* ("who holds admin rights right now?") with one implementation per platform, the dashboard, controls, reports, Data map and pricing stay exactly as they are.

## What stays the same, what changes

| Layer | Stays | Changes per platform |
| --- | --- | --- |
| Controls, statuses, report, credits | Everything | Nothing |
| Check definition | Intent, rule, thresholds | The query or API call, and how rows are read |
| Data map | Roles (risk, board, personal, test), tag meanings, own rules | The tree: `catalog.schema.table` vs `database.schema.table` vs `workspace.item.table`; what counts as a "tag" |
| Connection | "Read-only machine login + setup guide" | Identity type, grants, where queries run |
| Evidence | Summary, source, sample rows, timestamp | Source names |

Suggested shape in code: a `Connector` interface (`testConnection`, `readStructure`, `discoverTags`, `runCheck(intent, dataMap)`), with today's fixtures becoming the `databricks` connector. `Evidence.source` and the "Show how we got this answer" view already carry free-text sources, so they need no change.

## Snowflake: a close fit

Snowflake is the easier of the two, because almost everything is SQL over one schema.

| Need | Databricks today | Snowflake candidate |
| --- | --- | --- |
| Who did what | `system.access.audit` | `SNOWFLAKE.ACCOUNT_USAGE.LOGIN_HISTORY`, `QUERY_HISTORY`, `SESSIONS` |
| Who can access what | `information_schema.table_privileges` | `ACCOUNT_USAGE.GRANTS_TO_ROLES`, `GRANTS_TO_USERS` |
| Admin count | SCIM API, admins group | `GRANTS_TO_USERS` where role is `ACCOUNTADMIN` / `SECURITYADMIN` (pure SQL, no API) |
| Lineage | `system.access.table_lineage` | `ACCOUNT_USAGE.ACCESS_HISTORY` (objects read and modified), `OBJECT_DEPENDENCIES` |
| Tags | `*_tags` views | `ACCOUNT_USAGE.TAG_REFERENCES` |
| Masking | `column_masks` | `ACCOUNT_USAGE.POLICY_REFERENCES`, `MASKING_POLICIES` |
| History kept | Table property via REST | `ACCOUNT_USAGE.TABLES.RETENTION_TIME` (Time Travel days) |
| Scheduled jobs | `system.lakeflow.*` | `ACCOUNT_USAGE.TASK_HISTORY` (and dynamic table refresh history) |
| Quality checks | `system.data_quality_monitoring` | Data metric function results (`SNOWFLAKE.LOCAL.DATA_QUALITY_MONITORING_RESULTS`) |
| Outside sharing | `information_schema.recipients` | `SHOW SHARES`, data-sharing usage views |

**Connection (least privilege, to confirm):**

- A **service user** (`TYPE = SERVICE`) with **key-pair authentication**, no password, and a network policy limited to Receipts addresses.
- A dedicated role holding the Snowflake database roles `GOVERNANCE_VIEWER`, `SECURITY_VIEWER`, `USAGE_VIEWER` and `OBJECT_VIEWER`, rather than the broader `IMPORTED PRIVILEGES` on the `SNOWFLAKE` database.
- `USAGE` on one extra-small warehouse with auto-suspend.
- Queries sent with the Snowflake SQL API or the Node.js driver.

**Nice differences:** account usage views describe *every* object without any grant on the customer's own databases, so there is no equivalent of the per-catalog `BROWSE` step. The admin check needs no REST call.

**Watch out for:**

- `ACCOUNT_USAGE` views lag (roughly 45 minutes to 3 hours). "Fresh within the last hour" style rules need a different threshold, or `INFORMATION_SCHEMA` table functions for recent data.
- `ACCESS_HISTORY` and some governance features need Enterprise edition. A check should report "not enough evidence" on lower editions, not guess.
- `QUERY_HISTORY` contains query text, which can include literal values. Read counts and patterns only, and say so in the setup guide.
- Role hierarchy: "who is effectively admin" means walking inherited roles, not one lookup.

## Microsoft Fabric: possible, but a different shape

Fabric has no single "system tables" schema. Evidence is spread over tenant-level APIs, so most checks become **REST calls**, and the identity is a Microsoft Entra one.

| Need | Fabric candidate |
| --- | --- |
| Who did what | Power BI / Fabric **activity events** admin API; the Microsoft Purview audit log for longer history |
| Structure (workspaces, items, tables, columns) | Admin **scanner (metadata scanning) APIs**; Fabric REST `workspaces` and `items` |
| Who can access what | Workspace **role assignments**, item permissions, OneLake data access roles |
| Admin count | Members of the Fabric Administrator role in Entra (Microsoft Graph) plus workspace Admin role holders |
| Lineage | Scanner API upstream/downstream links; Purview Data Map if the customer uses it |
| "Tags" | **Sensitivity labels** (Purview Information Protection), **domains**, endorsement, and Fabric item tags |
| Masking and row security | Warehouse / SQL endpoint security metadata (`sys` views), OneLake security roles |
| Scheduled jobs | Pipeline and notebook **job instances** via the Fabric REST API; refresh history |
| Change review | Workspace **Git integration** (Azure DevOps or GitHub) and deployment pipelines |
| Query activity | Warehouse `queryinsights` views |

**Connection (least privilege, to confirm):**

- An **Entra app registration (service principal)** with a certificate, placed in a security group.
- A Fabric admin turns on the tenant setting that lets service principals use **read-only admin APIs**, scoped to that group. This gives tenant-wide metadata without making the principal a workspace member.
- Optional: a Microsoft Graph read permission for directory role membership, and audit-log read access if history beyond the activity API's window is needed.
- No workspace Contributor/Member role, so it cannot read or change item data.

**Watch out for:**

- **Retention:** activity events are kept for about a month. Receipts would have to pull them on a schedule and keep its own evidence history, or read the Purview audit log.
- **Throttling:** the scanner APIs are rate-limited and asynchronous (request a scan, poll, fetch). A scan takes minutes, not seconds.
- **The Data map changes most here.** The tree is workspace → item (lakehouse, warehouse, semantic model) → table, and "is this personal data?" is usually a sensitivity label on an item, not a column tag. Column-level classification may simply not exist.
- **Licensing and tenant settings** decide what is visible. Several checks will legitimately be "cannot be assessed on this setup".
- **Moving target:** Fabric governance APIs change often and several are in preview.

## How the product would handle more than one platform

- **Onboarding:** "Which platform do you use?" before the Connect step, then a platform-specific setup guide (`/setup/databricks`, `/setup/snowflake`, `/setup/fabric`) with the same structure: how we talk to it, steps, every permission and why, what we never get.
- **Checks:** each control lists which platforms can evidence it. A control with no implementation on a platform shows a clear fourth *coverage* note ("not available on Fabric yet"), **not** a fourth status. The three statuses stay.
- **Mixed estates:** many banks run two of these. Evidence carries its platform, a control's status is the worst across platforms, and the report groups evidence by platform.
- **Data map:** one map per connection, same four roles and tag meanings, with a per-platform vocabulary ("catalog" / "database" / "workspace").

## Suggested order

1. **Refactor first:** introduce the `Connector` interface and move today's fixtures behind it. No visible change.
2. **Snowflake:** highest reuse, mostly SQL, strong demand in Nordic financial services. Start with the 8–10 controls that map one-to-one (access, admin count, masking, retention, tags, ownership).
3. **Fabric discovery spike:** one week against a real tenant to learn what the read-only admin APIs actually return, before promising coverage.
4. **Fabric:** begin with access, ownership, labels and change review. Leave lineage and data-quality controls until the APIs settle.

## Open questions

- Do design partners want Snowflake or Fabric first, and do they run them next to Databricks?
- Pricing: is a report still one credit when it spans two platforms?
- Which controls are worth showing if only half the evidence types exist on a platform?
- Should Receipts integrate with Purview directly, since Fabric customers may already keep lineage and classification there?
- Who at the customer can grant tenant-level read access in Fabric? It is often a different team from the data platform engineers.
