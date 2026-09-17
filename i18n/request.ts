import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/i18n/locales";

export { LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/i18n/locales";

// كل namespace يُضاف هنا مع اتساع الواجهة. ملفات en الناقصة ترجع تلقائياً
// إلى ar عبر deepMerge أدناه، فلا يتعطّل أي مفتاح غير مُترجم بعد.
const NAMESPACES = [
  "common",
  "restaurant",
  "branches",
  "tables",
  "menus",
  "reservations",
  "eventReservations",
  "publicMenu",
  "loyalty",
  "inquiries",
  "complaints",
  "site",
  "analytics",
] as const;

function deepMerge(
  base: Record<string, unknown>,
  over: Record<string, unknown>
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base };
  for (const key of Object.keys(over)) {
    const b = base[key];
    const o = over[key];
    out[key] =
      b && o && typeof b === "object" && typeof o === "object" && !Array.isArray(b) && !Array.isArray(o)
        ? deepMerge(b as Record<string, unknown>, o as Record<string, unknown>)
        : o;
  }
  return out;
}

async function loadMessages(locale: Locale) {
  const merged: Record<string, unknown> = {};
  for (const ns of NAMESPACES) {
    const fallback = (await import(`../messages/${DEFAULT_LOCALE}/${ns}.json`)).default as Record<
      string,
      unknown
    >;
    if (locale === DEFAULT_LOCALE) {
      merged[ns] = fallback;
    } else {
      const primary = (await import(`../messages/${locale}/${ns}.json`)).default as Record<
        string,
        unknown
      >;
      merged[ns] = deepMerge(fallback, primary);
    }
  }
  return merged;
}

// يحلّل رأس Accept-Language ("ar,en;q=0.8" مثلاً) ويُرجع أول لغة مدعومة فيه،
// أو null إن لم توجد لغة مدعومة. يُستخدم فقط كخطوة أولى قبل أول زيارة (قبل
// وجود كوكي) — بعدها الكوكي هو المصدر الوحيد لتفضيل المستخدم الصريح.
function firstSupportedLocaleFromHeader(header: string): Locale | null {
  const tags = header.split(",").map((part) => part.split(";")[0].trim().toLowerCase());
  for (const tag of tags) {
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }
  return null;
}

// أولوية الحل: كوكي (تفضيل صريح مُخزَّن على هذا المتصفح) → تفضيل الحساب
// (profiles.locale، لمستخدم مسجَّل بلا كوكي بعد — جهاز جديد مثلاً) →
// Accept-Language (أول زيارة بلا شيء مما سبق) → الافتراضي `ar`.
async function resolveLocale(): Promise<Locale> {
  try {
    const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
    if (isLocale(cookieLocale)) return cookieLocale;
  } catch {
    // لا وصول للكوكي في هذا السياق.
  }

  try {
    // x-verified-user-id تُمرَّرها proxy.ts فقط لمسارات app/(app)/* المحمية
    // (غير موجودة إطلاقاً لمسارات المنيو العامة /m/*) — تجنّباً لاستعلام
    // قاعدة بيانات إضافي على كل زيارة منيو عامة بلا داعٍ.
    const userId = (await headers()).get("x-verified-user-id");
    if (userId) {
      const { createClient } = await import("@/lib/supabase/server");
      const supabase = await createClient();
      const { data } = await supabase.from("profiles").select("locale").eq("id", userId).single();
      if (isLocale(data?.locale)) return data.locale;
    }
  } catch {
    // لا وصول لقاعدة البيانات في هذا السياق (مثلاً أثناء البناء الساكن).
  }

  try {
    const acceptLanguage = (await headers()).get("accept-language");
    if (acceptLanguage) {
      const detected = firstSupportedLocaleFromHeader(acceptLanguage);
      if (detected) return detected;
    }
  } catch {
    // لا وصول للترويسات في هذا السياق.
  }

  return DEFAULT_LOCALE;
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();
  return {
    locale,
    messages: await loadMessages(locale),
  };
});
