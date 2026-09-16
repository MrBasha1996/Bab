import { notFound } from "next/navigation";
import { resolveTable } from "@/lib/domain/resolve-table";
import { recordQrScan } from "@/lib/actions/qr-scan.actions";
import { EntryGateway } from "@/components/public-menu/EntryGateway";

export default async function PublicEntryPage({
  params,
}: PageProps<"/m/[branchSlug]/t/[qrToken]">) {
  const { branchSlug, qrToken } = await params;
  const resolved = await resolveTable(branchSlug, qrToken);
  if (!resolved) notFound();

  await recordQrScan(resolved.branch.id, resolved.table.id, resolved.qrCodeId);

  return (
    <EntryGateway
      resolved={resolved}
      menuHref={`/m/${branchSlug}/t/${qrToken}/menu`}
      complaintHref={`/m/${branchSlug}/t/${qrToken}/complaint`}
    />
  );
}
