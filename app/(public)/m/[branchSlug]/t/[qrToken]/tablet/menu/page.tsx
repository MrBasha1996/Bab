import { notFound } from "next/navigation";
import { resolveTable } from "@/lib/domain/resolve-table";
import { getActiveMenuTree } from "@/lib/domain/get-menu-tree";
import { getTableReservation } from "@/lib/domain/get-table-reservation";
import { MenuHeader } from "@/components/public-menu/MenuHeader";
import { ReservationCard } from "@/components/public-menu/ReservationCard";
import { MenuBrowser } from "@/components/public-menu/MenuBrowser";
import { ActionBar } from "@/components/public-menu/ActionBar";

// وضع التابلت: نفس بيانات صفحة QR، بلا تسجيل حدث qr_scan (التابلت جهاز ثابت
// على الطاولة، ليس مسحاً فعلياً) وبتخطيط Full Screen بلا حاوية عرض محدودة.
export default async function TabletMenuPage({
  params,
}: PageProps<"/m/[branchSlug]/t/[qrToken]/tablet/menu">) {
  const { branchSlug, qrToken } = await params;
  const resolved = await resolveTable(branchSlug, qrToken);
  if (!resolved) notFound();

  const [{ categories, allergens }, reservation] = await Promise.all([
    getActiveMenuTree(resolved.branch.id, resolved.branch.timezone),
    getTableReservation(branchSlug, qrToken),
  ]);

  return (
    <div className="flex min-h-dvh flex-col">
      <MenuHeader resolved={resolved} tablet />
      {reservation && <ReservationCard reservation={reservation} />}
      <main className="flex-1 px-6 py-4">
        <MenuBrowser
          categories={categories}
          allergens={allergens}
          branchId={resolved.branch.id}
          tableId={resolved.table.id}
          source="tablet"
        />
      </main>
      <ActionBar />
    </div>
  );
}
