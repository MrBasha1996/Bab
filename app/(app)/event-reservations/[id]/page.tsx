import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPanel } from "@/components/event-reservation/StatusPanel";

export default async function EventReservationDetailPage({ params }: PageProps<"/event-reservations/[id]">) {
  await requireProfile();
  const { id } = await params;
  const t = await getTranslations("eventReservations.detail");
  const supabase = await createClient();

  const { data: reservation } = await supabase
    .from("event_reservations")
    .select(
      "id, reservation_type, company_name, contact_name, contact_phone, guest_count, event_date, status, notes"
    )
    .eq("id", id)
    .single();

  if (!reservation) notFound();

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/event-reservations" title={reservation.company_name || reservation.contact_name} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("reservationType")}:</span>{" "}
              {t(`type.${reservation.reservation_type}`)}
            </p>
            <p>
              <span className="text-muted-foreground">{t("contactName")}:</span> {reservation.contact_name}
            </p>
            <p dir="ltr" className="text-end">
              <span className="text-muted-foreground">{t("contactPhone")}:</span> {reservation.contact_phone}
            </p>
            <p>
              <span className="text-muted-foreground">{t("guestCount")}:</span> {reservation.guest_count}
            </p>
            <p>
              <span className="text-muted-foreground">{t("eventDate")}:</span>{" "}
              {new Date(reservation.event_date).toLocaleString()}
            </p>
            {reservation.notes && (
              <p>
                <span className="text-muted-foreground">{t("notes")}:</span> {reservation.notes}
              </p>
            )}
          </CardContent>
        </Card>
        <StatusPanel reservationId={reservation.id} status={reservation.status} />
      </div>
    </div>
  );
}
