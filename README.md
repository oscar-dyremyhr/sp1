# Receipts

> *Show the auditor your receipts.*
>
> Repo working name: **sp1** (side project 1). It will be renamed later.

**Receipts** turns a Databricks lakehouse into an auditor-ready evidence report for DORA, BCBS 239 and GDPR, so nobody has to rebuild compliance evidence by hand in spreadsheets.

This repository is the **front-end MVP**: a fully clickable product with **mocked data and no backend**, used to demo to design partners and test pricing. A visitor can land, start a trial, "connect" a workspace, generate an audit report, download it as a PDF, and meet the paywall when asking for a second one.

Everything shown is sample content for a fictional bank, **Nordlys Bank**. The control mappings are illustrative, not legal advice.

## Try it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Any email logs you in. The checkout only accepts the test card `4242 4242 4242 4242`. **Settings → Reset demo** returns you to a fresh trial.

## The journey

| Route | What it is |
| --- | --- |
| `/` | Landing page |
| `/setup` | Engineer setup guide: service principal, least-privilege grants, what Receipts never gets |
| `/pricing`, `/faq`, `/sample-report` | Pricing with monthly/annual toggle, FAQ, public read-only sample report |
| `/signup`, `/login` | Mocked auth (any email works) |
| `/app/welcome` | Onboarding wizard: company, regulations, connect workspace, first scan |
| `/app` | Dashboard: readiness score, status counts, top 3 things to fix, credits |
| `/app/controls` | Controls explorer with detail drawer, evidence and fix steps |
| `/app/data-map` | Data map: where risk, board, personal and test data live (whole catalogs, schemas or single tables), which tags the organisation uses, its own rules, and recommendations |
| `/app/reports/new` | Report wizard, then the receipt-printing animation |
| `/app/reports/:id` | Report viewer: Download PDF, copy share link, free 24-hour refresh |
| `/app/reports` | Report history: open, duplicate, compare |
| `/app/billing` | Plan, credits, usage, buy credits, upgrade, invoices |
| `/app/settings` | Team invites, workspace connections, Reset demo |
| `/share/:token` | Read-only shared report |
| `/styleguide` | Every design-system component |

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | [Next.js](https://nextjs.org) App Router + React 19 + TypeScript, hosted on Vercel |
| Styling | Tailwind CSS v4 mapped to design tokens as CSS variables; light and dark themes |
| Primitives | Radix UI (dialog, tooltip, accordion, dropdown), restyled; shadcn/ui is configured and themed |
| Motion | Motion (Framer Motion) |
| Charts | Recharts |
| State | Zustand, persisted to local storage |
| PDF | Print stylesheet + `window.print()` |
| Tests | Vitest (logic), Playwright + axe (journey, accessibility) |

## Project structure

```
src/
├── app/                 # Next.js routes only (thin files that render a screen)
├── design-system/
│   ├── tokens.css       # THE only place colours are defined (light, dark, print)
│   └── components/      # Button, StatusPill, ScoreGauge, EvidenceCard, Stamp, Stepper,
│                        # Drawer, Modal, DataTable, PlanCard, CreditCounter, EmptyState,
│                        # Stubby, Toast, Term (glossary tooltip) …
├── screens/
│   ├── marketing/       # Landing, Pricing, Faq, Auth, site header/footer
│   ├── app/             # Shell, Welcome, Dashboard, Controls, ReportWizard, Reports,
│   │                    # Billing, Settings, Paywall + checkout
│   └── report/          # The report document, viewer and printing animation
├── mocks/
│   ├── fixtures/        # Typed Nordlys Bank data: 24 controls, evidence, workspaces
│   ├── service.ts       # The ONLY file the UI imports for data (async, with delays)
│   └── types.ts
├── content/
│   ├── copy.ts          # Every user-facing string (ready for Norwegian and Danish)
│   ├── glossary.ts      # Plain-language definitions for technical words
│   └── pricing.ts       # Every price and plan
├── store/               # session, credits, reports (local storage)
├── lib/                 # scoring, report snapshots, formatting, hooks
└── test/                # Vitest unit tests
e2e/                     # Playwright: full journey + accessibility
```

### Rules worth keeping

- **Data** only flows through `src/mocks/service.ts`. Swap that file for a real API later and the UI does not change.
- **Colours** only come from `src/design-system/tokens.css`. No hex values in components. (One exception: `src/app/icon.svg`, a static file that cannot read CSS variables.)
- **Words** only come from `src/content/copy.ts`, written for a 12-year-old reading level. The report document itself is formal.
- **Prices** only come from `src/content/pricing.ts`.
- **Statuses** are exactly three, always with an icon and a word: *Looks good*, *Keep an eye on it*, *Needs fixing*.
- **One primary button** per app screen, top right, always worded *Generate audit report*.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm run start` | Production build / serve it |
| `npm run lint` | ESLint |
| `npm run type-check` | Generate route types, then `tsc` |
| `npm test` | Vitest unit tests (scoring, pricing, credits, snapshots, service) |
| `npm run test:e2e` | Playwright: builds the app, then runs the journey and accessibility tests |

For the end-to-end tests on a new machine, install the browser once:

```bash
npx playwright install chromium
```

## Demo data

Nordlys Bank has 2 workspaces, 14 catalogs and 24 controls (DORA 10, BCBS 239 8, GDPR 6), seeded to a readiness score of 72: 15 look good, 6 to keep an eye on, 3 need fixing. *Settings → Scan again* pretends the platform team fixed one more thing each time, which makes report comparison interesting. Old reports are frozen snapshots and never change.

## How the checks would work for real

Every control has a **Show how we got this answer** button. It shows the rule, each read-only check, a sample of the rows that came back, and how they were read. In this MVP those are fixtures in `src/mocks/fixtures/methods.ts`. In the real product a small backend would run them, in three ways:

| Source | How | Used for |
| --- | --- | --- |
| **System tables** (`system.access.audit`, `system.access.table_lineage`, `system.information_schema.*`, `system.lakeflow.*`) | SQL on a serverless SQL warehouse, sent with the [Statement Execution API](https://docs.databricks.com/api/workspace/statementexecution) (`POST /api/2.0/sql/statements`) or the `@databricks/sql` Node.js driver | Most checks: logins, permission changes, lineage, tags, masks, job runs |
| **Workspace REST APIs** (SCIM groups, Jobs, Unity Catalog tables, SQL alerts) | Plain HTTPS calls | Current state that system tables do not hold, such as who is an admin right now, or a table's history setting |
| **Code host API** (for example GitHub) | Plain HTTPS calls | Pull-request approvals, branch protection, policy and runbook history |

Notes for whoever builds it:

- Sign in as a **service principal with OAuth (machine to machine)**. It needs `USE CATALOG` on `system`, `USE SCHEMA` + `SELECT` on the system schemas it reads, metadata-only `BROWSE` on the catalogs in scope, and "Can use" on one SQL warehouse. No `SELECT` on business data and no admin role. The full list, with copyable grants, is on `/setup` (content in `src/content/setup.ts`).
- Queries run on a schedule (the "scan"), not when a page opens. Results are stored as evidence with the query text, a row sample and a timestamp, so a report is a frozen snapshot.
- Checks read **logs, settings and check results**, never business rows. Where a control needs a fact about the data (for example the oldest record), it reads the result of a data-quality check instead.
- Audit logs are regional, and account-level events use `workspace_id = 0`. Filter on `event_date` for speed. Statement text (`commandSubmit`) is only logged when **verbose audit logs** are on.
- Tag names (`owner`, `pii`, `retention_days`…), where each kind of data lives, and thresholds differ per customer. They are kept in the **Data map** (`/app/data-map`, logic in `src/lib/datamap.ts`). Check queries carry placeholders such as `{{tag.pii}}` and `{{scope:board:column}}` that are filled in from the saved map, so every re-scan uses it. A catalog or schema in the map covers tables added later.

## Deploying to Vercel

Import the repo at [vercel.com/new](https://vercel.com/new) and keep the detected Next.js defaults. Every push to `main` deploys.

## Not in this MVP

No backend, real auth, real payments or real Databricks calls. No real regulatory mappings. English only. In this demo a share link opens in the browser that made the report, because reports live in local storage.

## License

[MIT](LICENSE)
