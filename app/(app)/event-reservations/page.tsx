import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { EventReservationsListTable } from "@/components/event-reservation/EventReservationsListTable";

export default async function EventReservationsPage() {
  await requireProfile();
  const t = await getTranslations("eventReservations.pages");
  const supabase = await createClient();
  const [{ data: reservations }, { data: branches }] = await Promise.all([
    supabase
      .from("event_reservations")
      .select("id, branch_id, reservation_type, company_name, contact_name, contact_phone, guest_count, event_date, status, notes")
      .order("event_date", { ascending: false }),
    supabase.from("branches").select("id, name_ar"),
  ]);
  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name_ar]));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader
        title={t("listTitle")}
        description={t("listDescription")}
        actions={
          <Button asChild>
            <Link href="/event-reservations/new">{t("addReservation")}</Link>
          </Button>
        }
      />
      {reservations && reservations.length > 0 ? (
        <EventReservationsListTable
          rows={reservations.map((reservation) => ({
            id: reservation.id,
            branchId: reservation.branch_id,
            branchName: branchNameById.get(reservation.branch_id) ?? "",
            reservationType: reservation.reservation_type,
            companyName: reservation.company_name,
            contactName: reservation.contact_name,
            contactPhone: reservation.contact_phone,
            guestCount: reservation.guest_count,
            eventDate: reservation.event_date,
            status: reservation.status,
            notes: reservation.notes,
          }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
