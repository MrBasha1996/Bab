"use server";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import { complaintSchema, type ComplaintInput } from "@/lib/validation/complaint.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function submitComplaint(input: ComplaintInput): Promise<ActionResult> {
  const parsed = complaintSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase.from("complaints").insert({
    branch_id: parsed.data.branchId,
    table_id: parsed.data.tableId,
    type: parsed.data.type,
    message: parsed.data.message,
    customer_name: parsed.data.customerName || null,
    customer_phone: parsed.data.customerPhone || null,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}
