import { actionLocale } from "@/lib/i18n/server-locale";
import type { Locale } from "@/i18n/request";
import arActions from "@/messages/ar/actions.json";
import enActions from "@/messages/en/actions.json";

// مترجِم رسائل Server Actions. يقرأ JSON مباشرةً (لا عبر next-intl) كي يعمل
// داخل أي Server Action بلا سياق طلب next-intl كامل.
type Values = Record<string, string | number>;

function translate(locale: Locale, key: string, values?: Values): string {
  const messages = (locale === "en" ? enActions : arActions) as Record<string, unknown>;
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }
  let out = typeof node === "string" ? node : key;
  if (values) {
    for (const [k, v] of Object.entries(values)) out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}

export async function actionMsg(key: string, values?: Values): Promise<string> {
  return translate(await actionLocale(), key, values);
}

export async function invalidDataError(): Promise<string> {
  return actionMsg("common.invalidData");
}
