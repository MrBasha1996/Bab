import { test, expect } from "@playwright/test";

const TEST_EMAIL = "human-owner@bab.local";
const TEST_PASSWORD = "E2E-test-password-1!";

test("مدير يسجّل الدخول وينشئ حجزاً جديداً من لوحة الإدارة", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("البريد الإلكتروني").fill(TEST_EMAIL);
  await page.getByLabel("كلمة المرور").fill(TEST_PASSWORD);
  await page.getByRole("button", { name: "دخول" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10_000 });

  await page.goto("/reservations/new");
  await page.getByLabel("اسم العميل").fill("عميل اختبار E2E");
  await page.getByLabel("رقم الهاتف").fill("0512345678");
  await page.getByLabel("عدد الأشخاص").fill("2");

  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setHours(19, 0, 0, 0);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  await page.getByLabel("وقت الحجز").fill(`${y}-${m}-${d}T19:00`);

  await page.getByRole("button", { name: "حفظ" }).click();

  await expect(page).toHaveURL(/\/reservations\/[0-9a-f-]{36}$/, { timeout: 10_000 });
  await expect(page.getByRole("heading", { name: "عميل اختبار E2E" })).toBeVisible();
});
