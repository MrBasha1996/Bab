import { notFound } from "next/navigation";
import { resolveTable } from "@/lib/domain/resolve-table";
import { getActiveMenuTree } from "@/lib/domain/get-menu-tree";
import { getTableReservation } from "@/lib/domain/get-table-reservation";
import { MenuHeader } from "@/components/public-menu/MenuHeader";
import { ReservationCard } from "@/components/public-menu/ReservationCard";
import { MenuBrowser } from "@/components/public-menu/MenuBrowser";
import { ActionBar } from "@/components/public-menu/ActionBar";

export default async function PublicMenuPage({
  params,
}: PageProps<"/m/[branchSlug]/t/[qrToken]/menu">) {
  const { branchSlug, qrToken } = await params;
  const resolved = await resolveTable(branchSlug, qrToken);
  if (!resolved) notFound();

  const [{ categories, allergens }, reservation] = await Promise.all([
    getActiveMenuTree(resolved.branch.id, resolved.branch.timezone),
    getTableReservation(branchSlug, qrToken),
  ]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
      <MenuHeader resolved={resolved} />
      {reservation && <ReservationCard reservation={reservation} />}
      <main className="flex-1 px-4 py-4">
        <MenuBrowser
          categories={categories}
          allergens={allergens}
          branchId={resolved.branch.id}
          tableId={resolved.table.id}
          source="qr"
        />
      </main>
      <ActionBar loyaltyHref={`/m/${branchSlug}/loyalty`} restaurantId={resolved.restaurant.id} />
    </div>
  );
}
