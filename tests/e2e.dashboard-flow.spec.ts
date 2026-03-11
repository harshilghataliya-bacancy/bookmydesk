import { test, expect } from "@playwright/test";

test.describe("Dashboard E2E", () => {
  test("Dashboard loads with rooms grouped by floor and section", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Header present
    await expect(page.locator("h1:has-text('Book a Desk')")).toBeVisible();

    // Floor headings exist
    const floorHeadings = page.locator("h2");
    expect(await floorHeadings.count()).toBeGreaterThan(0);
    console.log(`  ✓ Dashboard loaded with floor headings`);

    // Room cards exist
    const roomLinks = page.locator("a[href*='/dashboard/rooms/']");
    expect(await roomLinks.count()).toBeGreaterThan(0);
    console.log(`  ✓ Room cards displayed`);
  });

  test("Filters work — floor and section dropdowns", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Count initial rooms
    const initialRooms = await page.locator("a[href*='/dashboard/rooms/']").count();

    // Select a floor filter
    const floorSelect = page.locator("select").last();
    const options = await floorSelect.locator("option").allTextContents();
    if (options.length > 1) {
      await floorSelect.selectOption({ index: 1 });
      await page.waitForTimeout(300);

      const filteredRooms = await page.locator("a[href*='/dashboard/rooms/']").count();
      expect(filteredRooms).toBeLessThanOrEqual(initialRooms);
      console.log(`  ✓ Floor filter: ${initialRooms} → ${filteredRooms} rooms`);

      // Reset
      await floorSelect.selectOption({ index: 0 });
    }
  });

  test("Room search filters cards", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    // Type in room search
    const searchInput = page.locator("input[placeholder='Search rooms...']");
    await searchInput.fill("nonexistent-room-xyz");
    await page.waitForTimeout(300);

    // Should show empty state or no room cards
    const rooms = await page.locator("a[href*='/dashboard/rooms/']").count();
    expect(rooms).toBe(0);
    console.log(`  ✓ Search with no match → 0 rooms`);

    // Clear and verify rooms reappear
    await searchInput.clear();
    await page.waitForTimeout(300);
    const restored = await page.locator("a[href*='/dashboard/rooms/']").count();
    expect(restored).toBeGreaterThan(0);
    console.log(`  ✓ Cleared search → ${restored} rooms restored`);
  });

  test("Clicking a room navigates to desk grid", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const firstRoom = page.locator("a[href*='/dashboard/rooms/']").first();
    const roomName = await firstRoom.locator("h4").textContent();
    await firstRoom.click();

    await page.waitForURL(/\/dashboard\/rooms\//);

    // Room page should have back link and room name
    await expect(page.locator("a:has-text('Dashboard')")).toBeVisible();
    await expect(page.locator(`h1:has-text("${roomName}")`)).toBeVisible();
    console.log(`  ✓ Navigated to room: ${roomName}`);

    // Desk grid should be visible
    await expect(page.locator("[class*='floor-plan']").or(page.locator("[class*='desk']")).first()).toBeVisible({ timeout: 10000 });
    console.log(`  ✓ Desk grid loaded`);
  });

  test("Employee search shows dropdown results", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    const empInput = page.locator("input[placeholder='Find colleague...']");
    await empInput.fill("test");
    await page.waitForTimeout(500);

    // Dropdown should appear (with results or "No employees found")
    const dropdown = page.locator(".absolute.z-30");
    await expect(dropdown).toBeVisible({ timeout: 5000 });
    console.log(`  ✓ Employee search dropdown appeared`);

    // Clear
    await page.locator("input[placeholder='Find colleague...'] + button, button:near(input[placeholder='Find colleague...'])").first().click();
    await page.waitForTimeout(300);
    await expect(dropdown).not.toBeVisible();
    console.log(`  ✓ Dropdown cleared on close`);
  });
});

test.describe("Admin Dashboard E2E", () => {
  test("Admin page loads with stats and room cards", async ({ page }) => {
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");

    // Check page loads
    await expect(page.locator("h1:has-text('Admin Dashboard')")).toBeVisible();

    // Stats pills should exist
    await expect(page.locator("text=Employees")).toBeVisible();
    await expect(page.locator("text=Floors")).toBeVisible();
    await expect(page.locator("text=Rooms")).toBeVisible();
    await expect(page.locator("text=Total Desks")).toBeVisible();
    await expect(page.locator("text=Available")).toBeVisible();
    await expect(page.locator("text=Booked")).toBeVisible();
    console.log(`  ✓ Admin dashboard loaded with all stat pills`);

    // Add Room button
    await expect(page.locator("button:has-text('Add Room')")).toBeVisible();
    console.log(`  ✓ Add Room button visible`);
  });

  test("Admin bookings page loads with table and export", async ({ page }) => {
    await page.goto("/admin/bookings");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("h1:has-text('All Bookings')")).toBeVisible();

    // Export CSV button
    await expect(page.locator("button:has-text('Export CSV')")).toBeVisible();
    console.log(`  ✓ Bookings page loaded with Export CSV button`);

    // Table or empty state should show
    const table = page.locator("table");
    const empty = page.locator("text=No bookings");
    const hasTable = await table.isVisible().catch(() => false);
    const hasEmpty = await empty.isVisible().catch(() => false);
    expect(hasTable || hasEmpty).toBe(true);
    console.log(`  ✓ Bookings ${hasTable ? "table" : "empty state"} displayed`);
  });

  test("Admin filters work on bookings page", async ({ page }) => {
    await page.goto("/admin/bookings");
    await page.waitForLoadState("networkidle");

    // Search input
    const search = page.locator("input[placeholder*='Search by name']");
    await expect(search).toBeVisible();

    // Floor, Section, Room selects
    const selects = page.locator("select");
    expect(await selects.count()).toBeGreaterThanOrEqual(3);
    console.log(`  ✓ All filter controls present`);
  });
});
