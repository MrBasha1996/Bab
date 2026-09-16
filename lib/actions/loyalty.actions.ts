"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import {
  loyaltySettingsSchema,
  type LoyaltySettingsInput,
  loyaltyTierSchema,
  type LoyaltyTierInput,
  loyaltyRewardSchema,
  type LoyaltyRewardInput,
  loyaltyRedemptionStatusSchema,
  type LoyaltyRedemptionStatusInput,
} from "@/lib/validation/loyalty.schema";
import type { ActionResult } from "@/lib/actions/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// restaurant_id للمستخدم الموظف الحالي عبر auth_restaurant_id() (تعمل لـ
// owner وbranch_manager معاً بلا اعتماد على profiles.restaurant_id مباشرة —
// راجع تعليق الدالة في 0015_loyalty.sql).
async function currentRestaurantId(supabase: SupabaseClient<Database>): Promise<string | null> {
  const { data } = await supabase.rpc("auth_restaurant_id");
  return data ?? null;
}

export async function upsertLoyaltySettings(input: LoyaltySettingsInput): Promise<ActionResult> {
  const parsed = loyaltySettingsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const restaurantId = await currentRestaurantId(supabase);
  if (!restaurantId) return { success: false, error: await invalidDataError() };

  const { error } = await supabase
    .from("loyalty_settings")
    .upsert(
      { restaurant_id: restaurantId, points_per_currency_unit: parsed.data.pointsPerCurrencyUnit },
      { onConflict: "restaurant_id" }
    );

  if (error) return { success: false, error: error.message };
  revalidatePath("/loyalty/settings");
  return { success: true };
}

export async function createLoyaltyTier(input: LoyaltyTierInput): Promise<ActionResult> {
  const parsed = loyaltyTierSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const restaurantId = await currentRestaurantId(supabase);
  if (!restaurantId) return { success: false, error: await invalidDataError() };

  const { error } = await supabase.from("loyalty_tiers").insert({
    restaurant_id: restaurantId,
    name_ar: parsed.data.nameAr,
    name_en: parsed.data.nameEn,
    min_points: parsed.data.minPoints,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/loyalty/settings");
  return { success: true };
}

export async function deleteLoyaltyTier(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_tiers").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/loyalty/settings");
  return { success: true };
}

export async function createLoyaltyReward(input: LoyaltyRewardInput): Promise<ActionResult> {
  const parsed = loyaltyRewardSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const restaurantId = await currentRestaurantId(supabase);
  if (!restaurantId) return { success: false, error: await invalidDataError() };

  const { error } = await supabase.from("loyalty_rewards").insert({
    restaurant_id: restaurantId,
    name_ar: parsed.data.nameAr,
    name_en: parsed.data.nameEn,
    points_cost: parsed.data.pointsCost,
    is_active: parsed.data.isActive,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/loyalty/settings");
  return { success: true };
}

export async function updateLoyaltyReward(id: string, input: LoyaltyRewardInput): Promise<ActionResult> {
  const parsed = loyaltyRewardSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("loyalty_rewards")
    .update({
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
      points_cost: parsed.data.pointsCost,
      is_active: parsed.data.isActive,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/loyalty/settings");
  return { success: true };
}

export async function deleteLoyaltyReward(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("loyalty_rewards").delete().eq("id", id);
  if (error) return { success: false, error: error.message };
  revalidatePath("/loyalty/settings");
  return { success: true };
}

export async function redeemLoyaltyRewardForMember(memberId: string, rewardId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_loyalty_reward_for_member", {
    p_member_id: memberId,
    p_reward_id: rewardId,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath(`/loyalty/scan/${memberId}`);
  return { success: true };
}

export async function updateLoyaltyRedemptionStatus(
  id: string,
  input: LoyaltyRedemptionStatusInput
): Promise<ActionResult> {
  const parsed = loyaltyRedemptionStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("loyalty_redemptions")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) return { success: false, error: error.message };
  revalidatePath("/loyalty/redemptions");
  return { success: true };
}
