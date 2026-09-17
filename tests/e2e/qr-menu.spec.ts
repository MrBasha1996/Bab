import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const TSX_CLI = join(process.cwd(), "node_modules/tsx/dist/cli.mjs");

let branchSlug: string;
let qrToken: string;

test.beforeAll(() => {
  const output = execFileSync(process.execPath, [TSX_CLI, "scripts/e2e/seed.ts"], { encoding: "utf-8" });
  const jsonLine = output.trim().split("\n").pop()!;
  ({ branchSlug, qrToken } = JSON.parse(jsonLine));
});

test("زائر يفتح رابط QR ويتصفح المنيو العام", async ({ page }) => {
  await page.goto(`/m/${branchSlug}/t/${qrToken}/menu`);

  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByPlaceholder(/بحث|search/i)).toBeVisible();

  const firstCategoryHeading = page.locator("h2").first();
  await expect(firstCategoryHeading).toBeVisible();

  const firstItem = page.locator("main [data-slot='card']").first();
  await firstItem.click();
  await expect(page.getByRole("dialog")).toBeVisible();
});
