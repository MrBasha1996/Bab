import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Locale, ScopeType } from "@/lib/supabase/types";

export interface Profile {
  id: string;
  restaurantId: string | null;
  branchId: string | null;
  roleKey: string | null;
  roleScope: ScopeType | null;
  capabilities: string[];
  fullName: string | null;
  locale: Locale;
}

/**
 * يجلب بروفايل المستخدم الحالي مرة واحدة لكل طلب (مُخزّن عبر React cache).
 * يُعيد null إن لم يكن هناك جلسة مسجّلة.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();

  // proxy.ts يتحقق من الـJWT (getClaims) لكل طلب ويمرّر الهوية المتحقق منها هنا
  // عبر ترويسة موثوقة، فنتجنّب رحلة تحقق مكررة.
  const verifiedUserId = (await headers()).get("x-verified-user-id");

  let userId = verifiedUserId;
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }

  if (!userId) return null;

  const { data, error } = await supabase
    .from("profiles")
    .select("id, restaurant_id, branch_id, role_id, full_name, locale")
    .eq("id", userId)
    .single();

  if (error || !data) return null;

  let roleKey: string | null = null;
  let roleScope: ScopeType | null = null;
  let capabilities: string[] = [];

  if (data.role_id) {
    const [{ data: role }, { data: caps }] = await Promise.all([
      supabase.from("roles").select("key, scope_type").eq("id", data.role_id).single(),
      supabase.from("role_capabilities").select("capability_key").eq("role_id", data.role_id),
    ]);
    roleKey = role?.key ?? null;
    roleScope = role?.scope_type ?? null;
    capabilities = caps?.map((c) => c.capability_key) ?? [];
  }

  return {
    id: data.id,
    restaurantId: data.restaurant_id,
    branchId: data.branch_id,
    roleKey,
    roleScope,
    capabilities,
    fullName: data.full_name,
    locale: data.locale === "en" ? "en" : "ar",
  };
});
