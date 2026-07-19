import type { Page } from "@playwright/test";
import { userA, type TestUser } from "./fixtures";

export async function login(page: Page, user: TestUser = userA) {
  await page.goto("/");
  await page.getByLabel("Email").fill(user.email);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}
