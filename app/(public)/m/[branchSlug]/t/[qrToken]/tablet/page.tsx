import { notFound } from "next/navigation";
import { resolveTable } from "@/lib/domain/resolve-table";
import { EntryGateway } from "@/components/public-menu/EntryGateway";

// وضع التابلت: بلا تسجيل حدث qr_scan (جهاز ثابت على الطاولة، ليس مسحاً فعلياً)،
// نفس منطق صفحة QR الأصلية قبل نقلها لمسار /menu.
export default async function TabletEntryPage({
  params,
}: PageProps<"/m/[branchSlug]/t/[qrToken]/tablet">) {
  const { branchSlug, qrToken } = await params;
  const resolved = await resolveTable(branchSlug, qrToken);
  if (!resolved) notFound();

  return (
    <EntryGateway
      resolved={resolved}
      menuHref={`/m/${branchSlug}/t/${qrToken}/tablet/menu`}
      complaintHref={`/m/${branchSlug}/t/${qrToken}/complaint`}
      ratingHref={`/m/${branchSlug}/t/${qrToken}/rating`}
      tablet
    />
  );
}
