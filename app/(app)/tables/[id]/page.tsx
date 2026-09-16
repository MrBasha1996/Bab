import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { TableForm } from "@/components/table/TableForm";
import { QrPanel } from "@/components/table/QrPanel";

export default async function TableDetailPage({ params }: PageProps<"/tables/[id]">) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: table } = await supabase
    .from("tables")
    .select("id, branch_id, label_ar, label_en")
    .eq("id", id)
    .single();

  if (!table) notFound();

  const [{ data: branch }, { data: qr }] = await Promise.all([
    supabase.from("branches").select("slug").eq("id", table.branch_id).single(),
    supabase.from("table_qr_codes").select("qr_token, is_active").eq("table_id", id).single(),
  ]);

  if (!branch || !qr) notFound();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const menuUrl = `${siteUrl}/m/${branch.slug}/t/${qr.qr_token}`;
  const qrDataUrl = await QRCode.toDataURL(menuUrl, { margin: 1, width: 320 });

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/tables" title={table.label_ar} />
      <div className="grid gap-6 md:grid-cols-2">
        <TableForm
          tableId={table.id}
          defaultValues={{
            branchId: table.branch_id,
            labelAr: table.label_ar,
            labelEn: table.label_en,
          }}
        />
        <QrPanel
          tableId={table.id}
          qrDataUrl={qrDataUrl}
          isActive={qr.is_active}
          fileName={`table-${table.label_en || table.id}`}
        />
      </div>
    </div>
  );
}
