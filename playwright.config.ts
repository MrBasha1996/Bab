import { defineConfig } from "@playwright/test";

const PORT = 3000;
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL,
    trace: "retain-on-failure",
    // الموقع يكتشف اللغة تلقائياً عبر ترويسة Accept-Language (راجع i18n/request.ts)؛
    // بلا هذا، Chromium الافتراضي يرسل en فتُعرَض الواجهة إنجليزية والاختبارات
    // (التي تبحث عن نصوص عربية) تفشل بصمت (timeout بدل خطأ واضح).
    locale: "ar-SA",
  },
  webServer: {
    command: "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
