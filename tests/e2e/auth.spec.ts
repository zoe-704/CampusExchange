import { test, expect } from "@playwright/test";
import { login } from "./helpers";

test.describe("signup", () => {
  test("rejects a non-@menloschool.org email client-side, without hitting the network", async ({ page }) => {
    await page.goto("/signup");

    let signupRequestFired = false;
    page.on("request", (req) => {
      if (req.url().includes("/auth/v1/signup")) signupRequestFired = true;
    });

    await page.getByLabel("Full Name").fill("Test Student");
    await page.getByLabel("School Email").fill("student@gmail.com");
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");
    await page.getByRole("button", { name: "Sign Up" }).click();

    await expect(page.getByText("Please use your @menloschool.org email address to sign up.")).toBeVisible();
    expect(signupRequestFired).toBe(false);
  });

  test("accepts a valid @menloschool.org email; handles both email-confirmation-required and immediate-session cases", async ({
    page,
  }) => {
    await page.goto("/signup");

    const uniqueEmail = `e2e-signup-${Date.now()}@menloschool.org`;
    await page.getByLabel("Full Name").fill("New Student");
    await page.getByLabel("School Email").fill(uniqueEmail);
    await page.getByLabel("Password", { exact: true }).fill("password123");
    await page.getByLabel("Confirm Password").fill("password123");

    const signupResponse = page.waitForResponse((res) => res.url().includes("/auth/v1/signup"));
    await page.getByRole("button", { name: "Sign Up" }).click();
    const res = await signupResponse;

    // A fresh unique address should always succeed (200/201/204) — a 429
    // here means Supabase's own email rate limit was hit, which is an
    // environment condition, not a regression in this app's code.
    test.skip(res.status() === 429, "Supabase auth email rate limit hit — not an app bug, retry later.");
    expect(res.ok()).toBe(true);

    const body = await res.json();
    if (body.session) {
      // This project has email confirmation OFF (or this address was
      // auto-confirmed) — signUp() returns a session immediately and
      // SignupPage navigates straight to the dashboard.
      await page.waitForURL("**/dashboard", { timeout: 10000 });
      await expect(page.getByText("Welcome back,")).toBeVisible();
    } else {
      // Email confirmation ON (the expected/current state for this
      // project) — no session yet, UI must show the check-your-inbox
      // state rather than pretending signup finished.
      await expect(page.getByText("Check your inbox")).toBeVisible();
      await expect(page.getByText(uniqueEmail)).toBeVisible();
    }
  });
});

test.describe("login", () => {
  test("rejects wrong credentials with an inline error", async ({ page }) => {
    await page.goto("/");
    await page.getByLabel("Email").fill("nobody@menloschool.org");
    await page.getByLabel("Password").fill("definitely-wrong-password");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 10000 });
    await expect(page).toHaveURL("/");
  });

  test("logs in with valid credentials and reaches the dashboard", async ({ page }) => {
    await login(page);
    await expect(page.getByText("Welcome back,")).toBeVisible();
    await expect(page.getByTestId("user-menu-trigger")).toBeVisible();
  });

  test("session persists across a hard reload — a fresh page load does not dump you back to login", async ({
    page,
  }) => {
    await login(page);
    await expect(page.getByTestId("user-menu-trigger")).toBeVisible();

    await page.reload({ waitUntil: "networkidle" });

    // Supabase's session lives in localStorage and is restored by
    // AuthProvider's getSession() call on mount — a reload must not
    // treat that as "logged out" and bounce to "/".
    await expect(page).toHaveURL("http://localhost:4173/dashboard");
    await expect(page.getByTestId("user-menu-trigger")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).not.toBeVisible();
  });

  test("session persists in a brand new page/tab (same browser storage state)", async ({ page, context }) => {
    await login(page);

    const secondPage = await context.newPage();
    await secondPage.goto("/dashboard");
    await expect(secondPage.getByTestId("user-menu-trigger")).toBeVisible();
    await secondPage.close();
  });
});

test.describe("logout", () => {
  test("signing out returns to the login screen and re-guards protected routes", async ({ page }) => {
    await login(page);

    await page.getByTestId("user-menu-trigger").click();
    await page.getByTestId("logout-button").click();

    await page.waitForURL("http://localhost:4173/", { timeout: 10000 });
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();

    // Protected route should now redirect back to login instead of rendering.
    await page.goto("/dashboard");
    await expect(page).toHaveURL("http://localhost:4173/");
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });
});
