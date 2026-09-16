import type { Locale } from "@/i18n/request";
import arValidation from "@/messages/ar/validation.json";
import enValidation from "@/messages/en/validation.json";

// مترجِم رسائل التحقق (zod). يقرأ JSON مباشرةً لا عبر next-intl، لأن مخططات
// zod تُبنى أيضاً داخل Server Actions بلا سياق طلب next-intl.

export type ValidationTranslator = (
  key: string,
  values?: Record<string, string | number>
) => string;

const DICTS: Record<Locale, Record<string, unknown>> = {
  ar: arValidation as Record<string, unknown>,
  en: enValidation as Record<string, unknown>,
};

export function validationTranslator(locale: Locale): ValidationTranslator {
  const primary = DICTS[locale] ?? DICTS.ar;
  return (key, values) => {
    const resolve = (dict: Record<string, unknown>): string | undefined => {
      let node: unknown = dict;
      for (const part of key.split(".")) {
        if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
          node = (node as Record<string, unknown>)[part];
        } else {
          return undefined;
        }
      }
      return typeof node === "string" ? node : undefined;
    };
    let out = resolve(primary) ?? resolve(DICTS.ar) ?? key;
    if (values) {
      for (const [k, v] of Object.entries(values)) out = out.replace(`{${k}}`, String(v));
    }
    return out;
  };
}
