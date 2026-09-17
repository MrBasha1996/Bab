"use server";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError, rateLimitedError } from "@/lib/i18n/action-messages";
import { isRateLimited } from "@/lib/rate-limit";
import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function submitInquiry(input: InquiryInput): Promise<ActionResult> {
  const parsed = inquirySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };
  if (await isRateLimited("publicWrite")) return { success: false, error: await rateLimitedError() };

  const supabase = await createClient();
  const { error } = await supabase.from("inquiries").insert({
    branch_id: parsed.data.branchId,
    name: parsed.data.name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    subject: parsed.data.subject || null,
    message: parsed.data.message,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}
