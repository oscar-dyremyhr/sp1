import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility checks from the brief: WCAG AA contrast in both themes,
 * and keyboard access to the main interactions.
 */

async function seedSignedIn(page: Page) {
  // A signed-in, onboarded trial user with no reports, written straight to local storage.
  await page.addInitScript(() => {
    if (localStorage.getItem("receipts-session")) return;
    const user = { id: "usr-e2e", name: "Ingrid Solberg", email: "ingrid@nordlys.example", role: "owner" };
    localStorage.setItem(
      "receipts-session",
      JSON.stringify({
        version: 1,
        state: {
          user,
          orgName: "Nordlys Bank",
          country: "Norway",
          onboarded: true,
          regulations: ["dora", "bcbs239", "gdpr"],
          workspaceUrl: "https://adb-7402115509.12.azuredatabricks.net",
          workspaceConnected: true,
          lastScanAt: "2026-11-10T06:12:00Z",
          trialEndsAt: "2026-11-25T00:00:00Z",
          team: [user],
        },
      }),
    );
  });
}

async function contrastViolations(page: Page) {
  // Let entrance animations settle so no text is measured half-faded.
  await page.waitForTimeout(3200);
  const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
  return results.violations.flatMap((v) => v.nodes.map((n) => `${n.target.join(" ")} :: ${n.failureSummary?.split("\n")[1] ?? ""}`));
}

const publicPages = ["/", "/pricing", "/faq", "/sample-report", "/signup", "/styleguide"];
const appPages = ["/app", "/app/controls", "/app/controls?control=dora-a9-02", "/app/reports/new", "/app/reports", "/app/billing", "/app/settings"];

for (const theme of ["light", "dark"] as const) {
  test(`text contrast passes WCAG AA in the ${theme} theme`, async ({ page }) => {
    await page.addInitScript((t) => localStorage.setItem("receipts-theme", t), theme);
    await seedSignedIn(page);
    const failures: string[] = [];
    for (const path of [...publicPages, ...appPages]) {
      await page.goto(path);
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.waitForLoadState("networkidle");
      for (const f of await contrastViolations(page)) failures.push(`${path} → ${f}`);
    }
    expect(failures, failures.join("\n")).toEqual([]);
  });
}

test("the controls explorer works with the keyboard alone", async ({ page }) => {
  await seedSignedIn(page);
  await page.goto("/app/controls");
  const row = page.locator('[data-control="dora-a9-02"]');
  await row.focus();
  await page.keyboard.press("Enter");
  const drawer = page.getByRole("dialog");
  await expect(drawer.getByRole("heading", { name: "Are admin rights kept to a small group?" })).toBeVisible();
  // Focus is trapped in the drawer; Escape closes it and returns focus to the row.
  await page.keyboard.press("Tab");
  expect(await drawer.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  // Tab may land on a glossary word and open its tooltip: the first Escape then
  // closes the tooltip and the second closes the drawer.
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  if (await drawer.isVisible()) await page.keyboard.press("Escape");
  await expect(drawer).toBeHidden();
  await expect(row).toBeFocused();

  // Glossary words can be reached and explained without a mouse.
  const term = page.locator("[data-term]").first();
  await term.focus();
  await expect(page.getByRole("tooltip")).toBeVisible();
});

test("status is never shown by colour alone", async ({ page }) => {
  await seedSignedIn(page);
  await page.goto("/app/controls");
  const pills = page.locator("[data-status]");
  await expect(pills.first()).toBeVisible();
  const count = await pills.count();
  expect(count).toBe(24);
  for (let i = 0; i < count; i++) {
    const pill = pills.nth(i);
    await expect(pill.locator("svg")).toHaveCount(1);
    await expect(pill).toHaveText(/Looks good|Keep an eye on it|Needs fixing/);
  }
});
