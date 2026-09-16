"use server";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import { tableSchema, type TableInput } from "@/lib/validation/table.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function createTable(input: TableInput): Promise<ActionResult> {
  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { data: table, error } = await supabase
    .from("tables")
    .insert({
      branch_id: parsed.data.branchId,
      label_ar: parsed.data.labelAr,
      label_en: parsed.data.labelEn,
    })
    .select("id")
    .single();

  if (error || !table) return { success: false, error: error?.message };

  const { error: qrError } = await supabase.from("table_qr_codes").insert({
    table_id: table.id,
    branch_id: parsed.data.branchId,
  });

  if (qrError) return { success: false, error: qrError.message };

  revalidatePath("/tables");
  redirect(`/tables/${table.id}`);
}

export async function updateTable(id: string, input: TableInput): Promise<ActionResult> {
  const parsed = tableSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("tables")
    .update({ label_ar: parsed.data.labelAr, label_en: parsed.data.labelEn })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/tables");
  revalidatePath(`/tables/${id}`);
  return { success: true };
}

export async function regenerateQr(tableId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const qrToken = randomBytes(32).toString("hex");
  const { error } = await supabase
    .from("table_qr_codes")
    .update({ qr_token: qrToken, is_active: true })
    .eq("table_id", tableId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/tables/${tableId}`);
  return { success: true };
}

export async function disableQr(tableId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("table_qr_codes")
    .update({ is_active: false })
    .eq("table_id", tableId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/tables/${tableId}`);
  return { success: true };
}
