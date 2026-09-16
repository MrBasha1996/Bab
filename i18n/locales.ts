// ثوابت اللغة بلا أي استيراد next/headers — قابلة للاستخدام من مكوّنات
// client (مثل LanguageSwitcher) بلا سحب next/headers إلى حزمة المتصفح.
export const LOCALES = ["ar", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
