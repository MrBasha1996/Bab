"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isLocale, LOCALE_COOKIE, type Locale } from "@/i18n/locales";

const ONE_YEAR = 60 * 60 * 24 * 365;

export async function setLocale(locale: Locale): Promise<{ ok: boolean }> {
  if (!isLocale(locale)) return { ok: false };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { error } = await supabase.rpc("set_my_locale", { p_locale: locale });
    if (error) return { ok: false };
  }

  const jar = await cookies();
  jar.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: ONE_YEAR,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
  return { ok: true };
}
