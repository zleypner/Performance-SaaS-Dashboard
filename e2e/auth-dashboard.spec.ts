import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test("should show signin page when accessing protected route", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/.*signin/);
    await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await page.goto("/auth/signin");

    await page.fill('input[id="email"]', "invalid@example.com");
    await page.fill('input[id="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    await expect(page.getByText("Invalid email or password")).toBeVisible();
  });

  test("should navigate between signin and signup", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.click("text=Sign up");
    await expect(page).toHaveURL(/.*signup/);
    await expect(page.getByRole("heading", { name: "Create an account" })).toBeVisible();

    await page.click("text=Sign in");
    await expect(page).toHaveURL(/.*signin/);
  });
});

test.describe("Dashboard Flow (requires database)", () => {
  // These tests require the database to be running and seeded
  // They should be run in CI with proper setup or locally after seeding

  test.skip("should login and view dashboard", async ({ page }) => {
    // Login with demo credentials
    await page.goto("/auth/signin");
    await page.fill('input[id="email"]', "demo@example.com");
    await page.fill('input[id="password"]', "demo123");
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

    // KPI cards should be visible
    await expect(page.getByText("Total Revenue")).toBeVisible();
    await expect(page.getByText("Active Users")).toBeVisible();
    await expect(page.getByText("Conversion Rate")).toBeVisible();
    await expect(page.getByText("Churn Rate")).toBeVisible();

    // Chart should be visible
    await expect(page.getByText("Revenue & Active Users")).toBeVisible();

    // Table should be visible
    await expect(page.getByText("Recent Transactions")).toBeVisible();
  });

  test.skip("should filter transactions", async ({ page }) => {
    // Assumes already logged in from previous test or use auth fixture
    await page.goto("/dashboard");

    // Apply status filter
    await page.click('button:has-text("All Statuses")');
    await page.click('text=Completed');

    // Wait for table to update
    await page.waitForResponse(response =>
      response.url().includes("/dashboard") && response.status() === 200
    );
  });

  test.skip("should navigate to reports and export CSV", async ({ page }) => {
    await page.goto("/reports");

    await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();

    // Filter section should be visible
    await expect(page.getByText("Filters")).toBeVisible();

    // Export button should be visible
    const exportButton = page.getByRole("button", { name: /Export CSV/i });
    await expect(exportButton).toBeVisible();
  });

  test.skip("should access settings page", async ({ page }) => {
    await page.goto("/settings");

    await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();

    // Profile tab should be active by default
    await expect(page.getByText("Profile Settings")).toBeVisible();

    // Should have security tab
    await page.click("text=Security");
    await expect(page.getByText("Change Password")).toBeVisible();

    // Should have organization tab
    await page.click("text=Organization");
    await expect(page.getByText("Organization Settings")).toBeVisible();
  });
});

test.describe("Landing Page", () => {
  test("should display landing page content", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "SaaS Dashboard" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign In" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Create Account" })).toBeVisible();
  });
});
