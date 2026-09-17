"use server";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError, rateLimitedError } from "@/lib/i18n/action-messages";
import { isRateLimited } from "@/lib/rate-limit";
import { ratingSchema, type RatingInput } from "@/lib/validation/rating.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function submitRating(input: RatingInput): Promise<ActionResult> {
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };
  if (await isRateLimited("publicWrite")) return { success: false, error: await rateLimitedError() };

  const supabase = await createClient();
  const { error } = await supabase.from("branch_ratings").insert({
    branch_id: parsed.data.branchId,
    table_id: parsed.data.tableId,
    stars: parsed.data.stars,
    comment: parsed.data.comment || null,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}
