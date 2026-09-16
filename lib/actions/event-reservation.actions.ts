"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import {
  eventReservationSchema,
  eventReservationStatusSchema,
  type EventReservationInput,
  type EventReservationStatusInput,
} from "@/lib/validation/event-reservation.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function createEventReservation(input: EventReservationInput): Promise<ActionResult> {
  const parsed = eventReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { data: reservation, error } = await supabase
    .from("event_reservations")
    .insert({
      branch_id: parsed.data.branchId,
      reservation_type: parsed.data.reservationType,
      company_name: parsed.data.companyName || null,
      contact_name: parsed.data.contactName,
      contact_phone: parsed.data.contactPhone,
      guest_count: parsed.data.guestCount,
      event_date: parsed.data.eventDate,
      notes: parsed.data.notes || null,
    })
    .select("id")
    .single();

  if (error || !reservation) return { success: false, error: error?.message };

  revalidatePath("/event-reservations");
  redirect(`/event-reservations/${reservation.id}`);
}

export async function updateEventReservationStatus(
  id: string,
  input: EventReservationStatusInput
): Promise<ActionResult> {
  const parsed = eventReservationStatusSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("event_reservations")
    .update({ status: parsed.data.status })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/event-reservations");
  revalidatePath(`/event-reservations/${id}`);
  return { success: true };
}
