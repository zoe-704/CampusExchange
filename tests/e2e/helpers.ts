import type { Page } from "@playwright/test";

export function testUserCredentials() {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;
  if (!email || !password) {
    throw new Error(
      "E2E_TEST_USER_EMAIL / E2E_TEST_USER_PASSWORD are not set. Add them to .env — see .env.example.",
    );
  }
  return { email, password };
}

export async function login(page: Page) {
  const { email, password } = testUserCredentials();
  await page.goto("/");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}
