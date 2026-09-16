"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import {
  reservationSchema,
  reservationStatusSchema,
  type ReservationInput,
  type ReservationStatusInput,
} from "@/lib/validation/reservation.schema";
import { replacePreorderItems } from "@/lib/actions/preorder.actions";
import type { ActionResult } from "@/lib/actions/types";

export async function createReservation(input: ReservationInput): Promise<ActionResult> {
  const parsed = reservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .insert({
      branch_id: parsed.data.branchId,
      name: parsed.data.customerName,
      phone: parsed.data.customerPhone,
    })
    .select("id")
    .single();

  if (customerError || !customer) return { success: false, error: customerError?.message };

  const { data: reservation, error: reservationError } = await supabase
    .from("reservations")
    .insert({
      branch_id: parsed.data.branchId,
      table_id: parsed.data.tableId || null,
      customer_id: customer.id,
      party_size: parsed.data.partySize,
      reservation_time: parsed.data.reservationTime,
      source: parsed.data.source,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (reservationError || !reservation) return { success: false, error: reservationError?.message };

  const preorderError = await replacePreorderItems(
    supabase,
    reservation.id,
    parsed.data.branchId,
    parsed.data.preorderItems
  );
  if (preorderError) return { success: false, error: preorderError };

  revalidatePath("/reservations");
  redirect(`/reservations/${reservation.id}`);
}

export async function updateReservationStatus(
  id: string,
  input: ReservationStatusInput
): Promise<ActionResult> {
  const parsed = reservationStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase.from("reservations").update({ status: parsed.data.status }).eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/reservations");
  revalidatePath(`/reservations/${id}`);
  return { success: true };
}
