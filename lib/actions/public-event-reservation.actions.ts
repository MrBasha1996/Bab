"use server";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import {
  publicEventReservationSchema,
  type PublicEventReservationInput,
} from "@/lib/validation/public-event-reservation.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function submitPublicEventReservation(
  input: PublicEventReservationInput
): Promise<ActionResult> {
  const parsed = publicEventReservationSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase.from("event_reservations").insert({
    branch_id: parsed.data.branchId,
    reservation_type: parsed.data.reservationType,
    company_name: parsed.data.companyName || null,
    contact_name: parsed.data.contactName,
    contact_phone: parsed.data.contactPhone,
    guest_count: parsed.data.guestCount,
    event_date: parsed.data.eventDate,
    notes: parsed.data.notes || null,
    status: "pending",
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}
