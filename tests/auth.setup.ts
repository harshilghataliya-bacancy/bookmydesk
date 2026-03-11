import { test as setup, expect } from "@playwright/test";
import { STORAGE_STATE } from "../playwright.config";

const GOOGLE_EMAIL = "harshil.ghataliya@bacancy.com";
const GOOGLE_PASSWORD = "JustWin12$";

setup("authenticate via Google OAuth", async ({ page }) => {
  setup.setTimeout(120000);

  // Go to login page
  await page.goto("/login");
  await expect(page.locator("text=Sign in with Google")).toBeVisible();
  console.log("✓ Login page loaded");

  // Click Sign in — this navigates to Google
  const [popup] = await Promise.all([
    page.waitForEvent("popup", { timeout: 5000 }).catch(() => null),
    page.click("text=Sign in with Google"),
  ]);

  // Google might open in same tab or popup
  const googlePage = popup || page;

  // Wait for Google login page to load
  await googlePage.waitForLoadState("domcontentloaded", { timeout: 20000 });
  await googlePage.waitForTimeout(2000);
  console.log("✓ Google auth page loaded");

  // Enter email
  const emailInput = googlePage.locator('input[type="email"]');
  await emailInput.waitFor({ state: "visible", timeout: 10000 });
  await emailInput.fill(GOOGLE_EMAIL);
  await googlePage.locator("#identifierNext").click();
  await googlePage.waitForTimeout(3000);
  console.log("✓ Email entered");

  // Enter password
  const passwordInput = googlePage.locator('input[type="password"]');
  await passwordInput.waitFor({ state: "visible", timeout: 10000 });
  await passwordInput.fill(GOOGLE_PASSWORD);
  await googlePage.locator("#passwordNext").click();
  await googlePage.waitForTimeout(5000);
  console.log("✓ Password entered");

  // Handle consent screen if it appears
  try {
    const continueButton = googlePage.locator(
      'button:has-text("Continue"), #submit_approve_access, button:has-text("Allow")'
    );
    if (await continueButton.isVisible({ timeout: 5000 })) {
      await continueButton.click();
      await googlePage.waitForTimeout(3000);
    }
  } catch {
    // No consent screen
  }

  // Wait for redirect back to app (main page, not popup)
  await page.waitForURL(/localhost:3001\/(dashboard|admin)/, { timeout: 30000 });
  console.log("✓ Authenticated and redirected");

  // Save auth state
  await page.context().storageState({ path: STORAGE_STATE });
  console.log("✓ Auth state saved");
});
