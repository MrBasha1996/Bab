"use server";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError, rateLimitedError } from "@/lib/i18n/action-messages";
import { isRateLimited } from "@/lib/rate-limit";
import {
  publicReservationSchema,
  type PublicReservationInput,
} from "@/lib/validation/public-reservation.schema";
import type { ActionResult } from "@/lib/actions/types";

// إدراج مزدوج (customers ثم reservations) عبر RPC واحدة بدل استعلامين
// مباشرين — تجنّباً لأي سياسة anon select على customers (بيانات عميل حساسة،
// راجع الملاحظة الأمنية في هجرة 0016_public_site.sql).
export async function submitPublicReservation(input: PublicReservationInput): Promise<ActionResult> {
  const parsed = publicReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };
  if (await isRateLimited("publicWrite")) return { success: false, error: await rateLimitedError() };

  const supabase = await createClient();
  const { error } = await supabase.rpc("create_public_reservation", {
    p_branch_id: parsed.data.branchId,
    p_customer_name: parsed.data.customerName,
    p_customer_phone: parsed.data.customerPhone,
    p_party_size: parsed.data.partySize,
    p_reservation_time: parsed.data.reservationTime,
    p_notes: parsed.data.notes || null,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}
