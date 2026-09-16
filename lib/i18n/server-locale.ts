import { getLocale } from "next-intl/server";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/request";

// لغة المستخدم داخل Server Action. خارج سياق طلب next-intl (اختبارات) يرمي
// getLocale، فنرجع اللغة الافتراضية.
export async function actionLocale(): Promise<Locale> {
  try {
    return (await getLocale()) as Locale;
  } catch {
    return DEFAULT_LOCALE;
  }
}
