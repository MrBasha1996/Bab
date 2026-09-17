import { test, expect } from "@playwright/test";

test("زائر يفتح صفحة الحجز العامة ويرسل طلب حجز طاولة بنجاح", async ({ page }) => {
  await page.goto("/site/reserve");

  await page.getByLabel("الاسم").fill("زائر اختبار");
  await page.getByLabel("الهاتف").fill("0512345678");
  await page.getByLabel("عدد الأشخاص").fill("4");

  await page.getByRole("button", { name: "اختر تاريخاً" }).click();
  await page.locator("button[data-day]:not([disabled])").first().click();

  await page.getByLabel("وقت الحجز").selectOption({ label: "13:00" });

  await page.getByRole("button", { name: "إرسال طلب الحجز" }).click();

  await expect(page.getByRole("heading", { name: "تم إرسال طلب الحجز" })).toBeVisible({ timeout: 10_000 });
});
