import type { DiscoveredTag, WorkspaceStructure } from "../types";

/**
 * The shape of Nordlys Bank's lakehouse, as it would be read from
 * system.information_schema (catalogs, schemata, tables). SAMPLE DATA.
 * catalog → schema → tables
 */
const tree: Record<string, { workspace: string; schemas: Record<string, string[]> }> = {
  risk: {
    workspace: "nordlys-prod",
    schemas: {
      regulatory: ["fct_credit_exposure", "fct_group_exposure", "agg_liquidity_coverage", "agg_manual_overrides", "fct_counterparty_fix", "fct_collateral_patch", "dim_counterparty"],
      board: ["agg_capital_ratios", "agg_large_exposures", "agg_liquidity_summary", "agg_risk_appetite"],
      staging: ["stg_exposures_raw", "stg_collateral_raw", "stg_ratings_feed"],
    },
  },
  finance: {
    workspace: "nordlys-prod",
    schemas: {
      ledger: ["fct_general_ledger", "dim_account", "dim_cost_center"],
      reporting: ["agg_profit_and_loss", "agg_balance_sheet", "agg_board_kpi_pack"],
    },
  },
  customers: {
    workspace: "nordlys-prod",
    schemas: {
      crm: ["dim_customer", "dim_prospects", "fct_campaign_contacts", "fct_chat_transcripts"],
      onboarding: ["fct_kyc_documents", "fct_video_ident_sessions", "dim_identity_checks"],
      legacy: ["dim_customer_2014_import", "fct_branch_visits"],
    },
  },
  payments: {
    workspace: "nordlys-prod",
    schemas: { cards: ["fct_card_transactions", "dim_merchant"], transfers: ["fct_sepa_transfers", "fct_instant_payments"] },
  },
  treasury: {
    workspace: "nordlys-prod",
    schemas: { positions: ["fct_cash_positions", "fct_fx_positions"], funding: ["fct_funding_plan", "agg_funding_gap"] },
  },
  lending: {
    workspace: "nordlys-prod",
    schemas: { mortgages: ["fct_mortgage_book", "dim_property"], corporate: ["fct_corporate_loans", "dim_covenants"] },
  },
  markets: {
    workspace: "nordlys-prod",
    schemas: { trading: ["fct_trades", "fct_positions_eod"], reference: ["dim_instrument", "dim_curve"] },
  },
  compliance: {
    workspace: "nordlys-prod",
    schemas: { aml: ["fct_alerts", "fct_case_decisions"], sanctions: ["fct_screening_hits", "dim_watchlists"] },
  },
  reference: {
    workspace: "nordlys-prod",
    schemas: { common: ["dim_calendar", "dim_currency", "dim_country", "dim_legal_entity"] },
  },
  analytics: {
    workspace: "nordlys-analytics",
    schemas: { marketing: ["agg_campaign_results", "fct_web_sessions"], product: ["agg_feature_usage", "agg_churn_scores"] },
  },
  sandbox: {
    workspace: "nordlys-analytics",
    schemas: { experiments: ["tmp_pricing_test", "tmp_segment_model"], scratch: ["tmp_join_check"] },
  },
  treasury_sandbox: {
    workspace: "nordlys-analytics",
    schemas: { models: ["tmp_liquidity_scenarios", "tmp_rate_shock"] },
  },
  reporting: {
    workspace: "nordlys-analytics",
    schemas: { dashboards: ["agg_exec_dashboard", "agg_branch_scorecard"], extracts: ["ext_regulator_monthly"] },
  },
  ml_features: {
    workspace: "nordlys-analytics",
    schemas: { credit: ["feat_credit_behaviour", "feat_income_stability"], fraud: ["feat_device_signals"] },
  },
};

export const structure: WorkspaceStructure = Object.entries(tree).map(([name, c]) => ({
  name,
  workspace: c.workspace,
  schemas: Object.entries(c.schemas).map(([schema, tables]) => ({ name: schema, tables })),
}));

/** Tags found in the workspace (from the *_tags views), with how often each is used. */
export const discoveredTags: DiscoveredTag[] = [
  { name: "pii", on: "columns", count: 1204 },
  { name: "personal_data", on: "columns", count: 37 },
  { name: "criticality", on: "tables", count: 512, values: ["critical", "high", "normal"] },
  { name: "owner", on: "tables", count: 2094 },
  { name: "data_owner", on: "tables", count: 18 },
  { name: "retention_days", on: "tables", count: 183 },
  { name: "business_service", on: "catalogs", count: 14 },
  { name: "processing_purpose", on: "tables", count: 187 },
  { name: "sensitivity", on: "tables", count: 640, values: ["sensitive", "internal", "public"] },
  { name: "cost_center", on: "catalogs", count: 14 },
  { name: "env", on: "catalogs", count: 14, values: ["prod", "dev"] },
];
