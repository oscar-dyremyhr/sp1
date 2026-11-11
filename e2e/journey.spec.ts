import { expect, test, type Page } from "@playwright/test";

/**
 * The core journey from the project brief, end to end on desktop:
 * landing → sign-up → onboarding → dashboard → first report → PDF → share link
 * → paywall on the second report → mocked purchase → second report → reset.
 */

async function signUpAndOnboard(page: Page) {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Show the auditor your receipts.");
  await page.getByTestId("hero-cta").click();

  await page.getByLabel("Your name").fill("Ingrid Solberg");
  await page.getByLabel("Work email").fill("ingrid@nordlys.example");
  await page.getByLabel("Company").fill("Nordlys Bank");
  await page.getByRole("button", { name: "Create account" }).click();

  // Onboarding: company → regulations → connect → first scan
  await expect(page.getByRole("heading", { name: "Tell us about your company" })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Which rules do you report on?" })).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  // Connect: the read-only service principal's details (any details work in the demo)
  await expect(page.getByLabel("Client ID")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the setup guide" })).toHaveAttribute("href", "/setup");
  await page.getByRole("button", { name: "Use the demo details" }).click();
  await page.getByRole("button", { name: "Test connection" }).click();
  await expect(page.getByText("Confirming it cannot read or change your data")).toBeVisible();
  await expect(page.getByTestId("connected")).toContainText("2 workspaces and 14 catalogs");
  await expect(page.getByTestId("connected")).toContainText("Signed in as receipts-readonly, read-only.");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Run first scan" }).click();
  await expect(page.getByRole("heading", { name: "Scan finished" })).toBeVisible();
  await page.getByRole("button", { name: "See my dashboard" }).click();
  await expect(page.getByTestId("dashboard")).toBeVisible();
}

async function runWizard(page: Page) {
  await expect(page.getByTestId("report-wizard")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByText("Who will read it?")).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByTestId("wizard-cost")).toHaveText("1 report credit");
}

test("a first-time visitor gets from the landing page to a downloaded report, then meets the paywall", async ({
  page,
  context,
}) => {
  const consoleErrors: string[] = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(e.message));

  await signUpAndOnboard(page);

  // Dashboard: seeded score, counts and one free credit
  await expect(page.getByTestId("score-value").first()).toHaveText("72");
  await expect(page.getByTestId("count-pass")).toHaveText("15");
  await expect(page.getByTestId("count-watch")).toHaveText("6");
  await expect(page.getByTestId("count-fix")).toHaveText("3");
  await expect(page.getByTestId("credit-counter")).toHaveText("1 report left");

  // Every control shows a plain title, a status word with an icon, evidence and fix steps
  await page.getByRole("link", { name: "Controls", exact: true }).click();
  await expect(page.getByTestId("control-count")).toHaveText("24 controls");
  await page.locator('[data-control="bcbs-p3-01"]').click();
  const drawer = page.getByTestId("control-drawer");
  await expect(page.getByRole("heading", { name: "Can you show where your risk numbers come from?" })).toBeVisible();
  await expect(drawer.locator("[data-status=watch]")).toHaveText("Keep an eye on it");
  await expect(drawer.getByText("system.access.table_lineage").first()).toBeVisible();
  await expect(drawer.getByText("Ask your data platform team to:")).toBeVisible();
  // "Show how we got this answer": the rule, each check's query and what came back
  await page.getByTestId("show-logic").click();
  const logic = page.getByTestId("control-logic");
  await expect(logic.getByText("38 of 41 is 93%, so it sits in the middle band.")).toBeVisible();
  await expect(logic.getByTestId("logic-check")).toHaveCount(3);
  await expect(logic.getByText("FROM system.access.table_lineage").first()).toBeVisible();
  await expect(logic.getByRole("cell", { name: "agg_manual_overrides", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(logic).toBeHidden();
  await page.getByTestId("share-fix").click();
  await expect(page.getByTestId("toast").filter({ hasText: "Message copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("Move the 3 notebooks into a scheduled job");
  await page.keyboard.press("Escape");

  // First report: wizard → printing animation → viewer
  await page.getByTestId("generate-top").click();
  await runWizard(page);
  await page.getByTestId("wizard-generate").click();
  await expect(page.getByTestId("generation-overlay")).toBeVisible();
  await expect(page.getByTestId("report-document")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("first-report-banner")).toBeVisible();
  await expect(page.getByTestId("report-score")).toHaveText("72");
  await expect(page.getByTestId("credit-counter")).toHaveText("0 reports left");
  const reportUrl = page.url();

  // Download PDF: the button prints, and print styles hide all app chrome
  await page.evaluate(() => {
    (window as unknown as { __printed: number }).__printed = 0;
    window.print = () => void (window as unknown as { __printed: number }).__printed++;
  });
  await page.getByTestId("download-pdf").click();
  expect(await page.evaluate(() => (window as unknown as { __printed: number }).__printed)).toBe(1);
  await page.emulateMedia({ media: "print" });
  await expect(page.getByTestId("generate-top")).toBeHidden();
  await expect(page.getByRole("navigation", { name: "Main" })).toBeHidden();
  await expect(page.getByTestId("report-cover")).toBeVisible();
  await expect(page.getByRole("heading", { name: "1. Executive summary" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "3. Control-by-control results" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Appendix A. Lineage snapshots" })).toBeVisible();
  const pdf = await page.pdf({ format: "A4" });
  expect(pdf.byteLength).toBeGreaterThan(20_000);
  await page.emulateMedia({ media: "screen" });

  // Share link opens the report read-only in a fresh tab
  await page.getByTestId("copy-share-link").click();
  const shareUrl = await page.evaluate(() => navigator.clipboard.readText());
  expect(shareUrl).toContain("/share/");
  const tab = await context.newPage();
  await tab.goto(shareUrl);
  await expect(tab.getByTestId("shared-banner")).toBeVisible();
  await expect(tab.getByTestId("report-score")).toHaveText("72");
  await expect(tab.getByTestId("copy-share-link")).toHaveCount(0);
  await expect(tab.getByText("Refresh report")).toHaveCount(0);
  await tab.close();

  // Second report: the paywall appears (a friendly modal, not an error)
  await page.getByTestId("generate-top").click();
  await expect(page.getByTestId("paywall")).toBeVisible();
  await expect(page.getByRole("heading", { name: "You’ve used your free report" })).toBeVisible();
  await expect(page.getByTestId("paywall-single")).toContainText("€390");
  await expect(page.getByTestId("paywall-pack5")).toContainText("€1,690");
  await expect(page.getByTestId("paywall-plan")).toContainText("€990");

  // The first report always stays viewable
  await page.getByRole("button", { name: "Not now" }).click();
  await page.goto(reportUrl);
  await expect(page.getByTestId("report-score")).toHaveText("72");

  // Mocked purchase: wrong card is refused, the test card works, credits are added
  await page.getByTestId("generate-top").click();
  await page.getByTestId("paywall-single").click();
  await page.getByLabel("Card number").fill("4111 1111 1111 1111");
  await page.getByTestId("pay").click();
  await expect(page.getByRole("alert")).toContainText("only takes the test card");
  await page.getByTestId("fill-test-card").click();
  await page.getByTestId("pay").click();
  await expect(page.getByTestId("checkout-success")).toContainText("1 credit added");
  await page.getByTestId("checkout-continue").click();
  await expect(page.getByTestId("credit-counter")).toHaveText("1 report left");

  // …and the report then generates
  await runWizard(page);
  await page.getByTestId("wizard-generate").click();
  await expect(page.getByTestId("report-document")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("credit-counter")).toHaveText("0 reports left");
  await page.getByRole("link", { name: "All reports" }).click();
  await expect(page.getByTestId("open-report")).toHaveCount(2);

  // State survives a reload (local storage)
  await page.reload();
  await expect(page.getByTestId("open-report")).toHaveCount(2);

  // Reset demo returns the app to a fresh trial
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByTestId("reset-demo").click();
  await page.getByTestId("reset-confirm").click();
  await expect(page.getByRole("heading", { name: "Tell us about your company" })).toBeVisible();
  const stored = await page.evaluate(() => ({
    credits: JSON.parse(localStorage.getItem("receipts-credits") ?? "{}").state,
    reports: JSON.parse(localStorage.getItem("receipts-reports") ?? "{}").state,
  }));
  expect(stored.credits).toMatchObject({ plan: "trial", credits: 1 });
  expect(stored.reports.reports).toHaveLength(0);

  expect(consoleErrors, `console errors:\n${consoleErrors.join("\n")}`).toEqual([]);
});

test("pricing comes from the pricing config and the annual toggle updates it", async ({ page }) => {
  await page.goto("/pricing");
  const team = page.locator('[data-plan="Team"]');
  await expect(team.getByTestId("plan-price")).toHaveText("€990");
  await expect(page.locator('[data-plan="Pay as you go"]').getByTestId("plan-price")).toHaveText("€390");
  await page.getByRole("radio", { name: /Annual/ }).click();
  await expect(team.getByTestId("plan-price")).toHaveText("€825");
  await expect(team).toContainText("Billed yearly at €9,900. You save €1,980.");
  await expect(page.locator('[data-plan="Enterprise"]').getByTestId("plan-price")).toHaveText("€2,417");
});

test("public pages work without an account, and /app sends visitors to log in", async ({ page }) => {
  await page.goto("/sample-report");
  await expect(page.getByText("This is a sample report with made-up data.")).toBeVisible();
  await expect(page.getByTestId("report-score")).toHaveText("72");

  // The engineer setup guide: least-privilege grants, and what Receipts never gets
  await page.goto("/setup");
  const guide = page.getByTestId("setup-guide");
  await expect(guide.getByRole("heading", { level: 1 })).toHaveText("Connect Receipts to Databricks");
  await expect(guide.getByText("GRANT USE SCHEMA, SELECT ON SCHEMA system.access TO `receipts-readonly`;")).toBeVisible();
  await expect(guide.getByText("GRANT BROWSE ON CATALOG risk")).toBeVisible();
  await expect(guide.getByText("SELECT on your business tables")).toBeVisible();

  await page.goto("/faq");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await page.goto("/styleguide");
  for (const name of ["Button", "Status pill", "Score gauge", "Evidence card", "Stamp", "Stepper", "Drawer and modal", "Data table", "Plan card", "Credit counter", "Empty state with Stubby", "Toast"]) {
    await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
  }

  await page.goto("/app");
  await expect(page).toHaveURL(/\/login$/);
});

test("the theme toggle switches to dark and is remembered", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByTestId("theme-toggle").click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
});

test("reduced motion turns off the big animations", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await signUpAndOnboard(page);
  await page.getByTestId("generate-top").click();
  await runWizard(page);
  await page.getByTestId("wizard-generate").click();
  const overlay = page.getByTestId("generation-overlay");
  await expect(overlay).toBeVisible();
  // No flying evidence cards while printing, and no confetti afterwards.
  await expect(overlay.getByText("1,946 grants checked")).toHaveCount(0);
  await expect(page.getByTestId("report-document")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId("first-report-banner")).toBeVisible();
  await expect(page.getByTestId("confetti")).toHaveCount(0);
});
