import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { TablesListTable } from "@/components/table/TablesListTable";

export default async function TablesPage() {
  await requireProfile();
  const t = await getTranslations("tables.pages");
  const supabase = await createClient();
  const [{ data: tables }, { data: branches }, { data: qrCodes }] = await Promise.all([
    supabase
      .from("tables")
      .select("id, branch_id, label_ar, label_en, created_at")
      .is("deleted_at", null)
      .order("label_ar"),
    supabase.from("branches").select("id, name_ar"),
    supabase.from("table_qr_codes").select("table_id, is_active"),
  ]);
  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name_ar]));
  const qrActiveByTableId = new Map((qrCodes ?? []).map((q) => [q.table_id, q.is_active]));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader
        title={t("listTitle")}
        description={t("listDescription")}
        actions={
          <Button asChild>
            <Link href="/tables/new">{t("addTable")}</Link>
          </Button>
        }
      />
      {tables && tables.length > 0 ? (
        <TablesListTable
          rows={tables.map((table) => ({
            id: table.id,
            branchId: table.branch_id,
            branchName: branchNameById.get(table.branch_id) ?? "",
            labelAr: table.label_ar,
            labelEn: table.label_en,
            createdAt: table.created_at,
            qrActive: qrActiveByTableId.get(table.id) ?? null,
          }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
