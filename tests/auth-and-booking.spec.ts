import { test, expect } from "@playwright/test";

const GOOGLE_EMAIL = "harshil.ghataliya@bacancy.com";
const GOOGLE_PASSWORD = "JustWin12$";

test.describe("BookMyDesk - Full Flow", () => {
  test("Login with Google, browse floors, and book a desk", async ({ page }) => {
    // Step 1: Go to login page
    await page.goto("/login");
    await expect(page.locator("text=BookMyDesk")).toBeVisible();
    await expect(page.locator("text=Sign in with Google")).toBeVisible();

    console.log("✓ Login page loaded");

    // Step 2: Click Sign in with Google
    await page.click("text=Sign in with Google");

    // Step 3: Handle Google OAuth - wait for Google login page
    await page.waitForURL(/accounts\.google\.com/, { timeout: 15000 });
    console.log("✓ Redirected to Google");

    // Enter email
    await page.fill('input[type="email"]', GOOGLE_EMAIL);
    await page.click("#identifierNext");
    await page.waitForTimeout(3000);

    // Enter password
    await page.waitForSelector('input[type="password"]', {
      state: "visible",
      timeout: 10000,
    });
    await page.fill('input[type="password"]', GOOGLE_PASSWORD);
    await page.click("#passwordNext");
    await page.waitForTimeout(3000);

    // Handle "Continue" consent if it appears
    try {
      const continueButton = page.locator('button:has-text("Continue"), #submit_approve_access');
      if (await continueButton.isVisible({ timeout: 5000 })) {
        await continueButton.click();
      }
    } catch {
      // No consent screen, that's fine
    }

    // Step 4: Wait for redirect back to app
    await page.waitForURL(/localhost:3001\/dashboard/, { timeout: 30000 });
    console.log("✓ Logged in, redirected to dashboard");

    // Step 5: Verify dashboard loaded with floors
    await expect(page.locator("text=Dashboard")).toBeVisible();
    await expect(page.locator("text=Floor 1")).toBeVisible();
    await expect(page.locator("text=Floor 2")).toBeVisible();
    await expect(page.locator("text=Floor 3")).toBeVisible();
    console.log("✓ Dashboard shows 3 floors");

    // Step 6: Click Floor 1
    await page.click("text=Floor 1");
    await page.waitForURL(/\/dashboard\/floors\//);
    await expect(page.locator("text=15th Side")).toBeVisible();
    await expect(page.locator("text=16th Side")).toBeVisible();
    console.log("✓ Floor 1 shows 2 sections");

    // Step 7: Click 15th Side section
    await page.click("text=15th Side");
    await page.waitForURL(/\/sections\//);
    await expect(page.locator("text=Room 15th")).toBeVisible();
    console.log("✓ Section shows room");

    // Step 8: Click room to see desk grid
    await page.click("a:has-text('Room 15th')");
    await page.waitForURL(/\/dashboard\/rooms\//);

    // Wait for desk grid to load
    await expect(page.locator("text=Available")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("text=Booked")).toBeVisible();
    console.log("✓ Room map loaded with desk grid");

    // Step 9: Click an available desk (desk 1)
    const availableDesk = page.locator("button:has-text('1')").first();
    await expect(availableDesk).toBeVisible();
    await availableDesk.click();

    // Step 10: Booking modal should appear
    await expect(page.locator("text=Confirm Booking")).toBeVisible({ timeout: 5000 });
    console.log("✓ Booking modal appeared");

    // Step 11: Confirm booking
    await page.click("button:has-text('Confirm')");

    // Step 12: Wait for success
    await expect(page.locator("text=booked successfully")).toBeVisible({ timeout: 10000 });
    console.log("✓ Desk booked successfully!");

    // Step 13: Check My Desk page
    await page.goto("/dashboard/my-desk");
    await expect(page.locator("text=Booking Confirmed")).toBeVisible({ timeout: 10000 });
    console.log("✓ My Desk page shows confirmation");

    // Step 14: Go back to room and verify view-only mode
    await page.goBack();
    await page.goBack();
    await page.click("a:has-text('Room 15th')");
    await page.waitForURL(/\/dashboard\/rooms\//);
    await expect(page.locator("text=View only")).toBeVisible({ timeout: 10000 });
    console.log("✓ Room is now view-only mode");

    console.log("\n✅ All tests passed!");
  });
});
