import { test, expect } from "@playwright/test";
import { execFileSync } from "node:child_process";
import { writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import os from "node:os";

const TSX_CLI = join(process.cwd(), "node_modules/tsx/dist/cli.mjs");

// اختبار جزئي بالاتفاق مع المستخدم: لا يوجد dev-bypass لـGoogle OAuth في الكود
// حالياً، فبدل قيادة شاشة Google الحقيقية نحقن جلسة Supabase صالحة مباشرة عبر
// كوكي (راجع scripts/e2e/create-loyalty-session.ts). النتيجة الدقيقة لاستخراج
// المبلغ عبر OCR غير محدَّدة هنا عمداً لأن صورة الاختبار ليست فاتورة حقيقية —
// الاختبار يتحقق فقط أن الرفع يكتمل ويُظهر إشعاراً (نجاح أو رفض) بلا تعليق/عطل.
let branchSlug: string;
let cookies: { name: string; value: string; path: string; sameSite: "Lax" | "Strict" | "None" }[];

test.beforeAll(() => {
  const output = execFileSync(process.execPath, [TSX_CLI, "scripts/e2e/create-loyalty-session.ts"], {
    encoding: "utf-8",
  });
  const jsonLine = output.trim().split("\n").pop()!;
  ({ branchSlug, cookies } = JSON.parse(jsonLine));
});

test("عضو ولاء (بجلسة محقونة) يرى لوحة تحكمه ويرفع صورة فاتورة", async ({ page, context }) => {
  await context.addCookies(cookies.map((c) => ({ ...c, domain: "localhost" })));

  await page.goto(`/m/${branchSlug}/loyalty`);

  await expect(page.getByText("رصيدك من النقاط")).toBeVisible();
  const fileInput = page.locator("input[type='file']");
  await expect(fileInput).toBeVisible();

  const tmpImagePath = join(os.tmpdir(), `e2e-receipt-${Date.now()}.png`);
  const onePixelPng = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
    "base64"
  );
  writeFileSync(tmpImagePath, onePixelPng);

  try {
    await fileInput.setInputFiles(tmpImagePath);
    await page.getByRole("button", { name: "إرسال" }).click();
    await expect(page.locator("[data-sonner-toast]")).toBeVisible({ timeout: 30_000 });
  } finally {
    unlinkSync(tmpImagePath);
  }
});
