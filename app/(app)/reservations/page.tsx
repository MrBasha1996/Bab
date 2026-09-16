import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ReservationsListTable } from "@/components/reservation/ReservationsListTable";

export default async function ReservationsPage() {
  await requireProfile();
  const t = await getTranslations("reservations.pages");
  const supabase = await createClient();
  const [{ data: reservations }, { data: customers }, { data: tables }, { data: branches }] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, branch_id, table_id, customer_id, party_size, reservation_time, source, status, notes")
      .order("reservation_time", { ascending: false }),
    supabase.from("customers").select("id, name, phone"),
    supabase.from("tables").select("id, label_ar"),
    supabase.from("branches").select("id, name_ar"),
  ]);
  const customerById = new Map((customers ?? []).map((c) => [c.id, c]));
  const tableById = new Map((tables ?? []).map((table) => [table.id, table]));
  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name_ar]));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader
        title={t("listTitle")}
        description={t("listDescription")}
        actions={
          <Button asChild>
            <Link href="/reservations/new">{t("addReservation")}</Link>
          </Button>
        }
      />
      {reservations && reservations.length > 0 ? (
        <ReservationsListTable
          rows={reservations.map((reservation) => {
            const customer = customerById.get(reservation.customer_id);
            const table = reservation.table_id ? tableById.get(reservation.table_id) : null;
            return {
              id: reservation.id,
              branchId: reservation.branch_id,
              branchName: branchNameById.get(reservation.branch_id) ?? "",
              customerName: customer?.name ?? "",
              customerPhone: customer?.phone ?? "",
              partySize: reservation.party_size,
              reservationTime: reservation.reservation_time,
              tableLabel: table?.label_ar ?? null,
              source: reservation.source,
              status: reservation.status,
              notes: reservation.notes,
            };
          })}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
