import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getActiveMenuTree } from "@/lib/domain/get-menu-tree";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { StatusPanel } from "@/components/reservation/StatusPanel";
import { PreorderPanel } from "@/components/reservation/PreorderPanel";

export default async function ReservationDetailPage({ params }: PageProps<"/reservations/[id]">) {
  await requireProfile();
  const { id } = await params;
  const t = await getTranslations("reservations.detail");
  const supabase = await createClient();

  const { data: reservation } = await supabase
    .from("reservations")
    .select("id, branch_id, table_id, customer_id, party_size, reservation_time, source, status, notes")
    .eq("id", id)
    .single();

  if (!reservation) notFound();

  const [{ data: customer }, { data: table }, { data: branch }, { data: preorderRows }] = await Promise.all([
    supabase.from("customers").select("name, phone").eq("id", reservation.customer_id).single(),
    reservation.table_id
      ? supabase.from("tables").select("label_ar").eq("id", reservation.table_id).single()
      : Promise.resolve({ data: null }),
    supabase.from("branches").select("timezone").eq("id", reservation.branch_id).single(),
    supabase
      .from("reservation_preorder_items")
      .select("menu_item_id, item_variant_id, second_menu_item_id, second_item_variant_id, quantity, notes")
      .eq("reservation_id", reservation.id),
  ]);

  const { categories } = branch ? await getActiveMenuTree(reservation.branch_id, branch.timezone) : { categories: [] };
  const branchItems = categories.flatMap((c) => c.items);

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/reservations" title={customer?.name ?? ""} />
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="grid gap-2 text-sm">
            <p>
              <span className="text-muted-foreground">{t("customerName")}:</span> {customer?.name}
            </p>
            <p dir="ltr" className="text-end">
              <span className="text-muted-foreground">{t("customerPhone")}:</span> {customer?.phone}
            </p>
            <p>
              <span className="text-muted-foreground">{t("partySize")}:</span> {reservation.party_size}
            </p>
            <p>
              <span className="text-muted-foreground">{t("reservationTime")}:</span>{" "}
              {new Date(reservation.reservation_time).toLocaleString()}
            </p>
            {table && (
              <p>
                <span className="text-muted-foreground">{t("table")}:</span> {table.label_ar}
              </p>
            )}
            <p>
              <span className="text-muted-foreground">{t("source")}:</span> {t(`sourceValue.${reservation.source}`)}
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
      <PreorderPanel
        reservationId={reservation.id}
        branchId={reservation.branch_id}
        branchItems={branchItems}
        initialItems={(preorderRows ?? []).map((row) => ({
          menuItemId: row.menu_item_id,
          itemVariantId: row.item_variant_id ?? "",
          secondMenuItemId: row.second_menu_item_id ?? "",
          secondItemVariantId: row.second_item_variant_id ?? "",
          quantity: row.quantity,
          notes: row.notes ?? "",
        }))}
      />
    </div>
  );
}
