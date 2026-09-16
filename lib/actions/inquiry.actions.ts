"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import {
  inquiryStatusSchema,
  type InquiryStatusInput,
} from "@/lib/validation/inquiry.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function updateInquiryStatus(id: string, input: InquiryStatusInput): Promise<ActionResult> {
  const parsed = inquiryStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/inquiries");
  revalidatePath(`/inquiries/${id}`);
  return { success: true };
}
