import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ComplaintsListTable } from "@/components/complaint/ComplaintsListTable";

export default async function ComplaintsPage() {
  await requireProfile();
  const t = await getTranslations("complaints.pages");
  const supabase = await createClient();
  const [{ data: complaints }, { data: branches }, { data: tables }] = await Promise.all([
    supabase
      .from("complaints")
      .select("id, branch_id, table_id, type, message, customer_name, customer_phone, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("branches").select("id, name_ar"),
    supabase.from("tables").select("id, label_ar"),
  ]);
  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name_ar]));
  const tableLabelById = new Map((tables ?? []).map((table) => [table.id, table.label_ar]));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title={t("listTitle")} description={t("listDescription")} />
      {complaints && complaints.length > 0 ? (
        <ComplaintsListTable
          rows={complaints.map((complaint) => ({
            id: complaint.id,
            branchId: complaint.branch_id,
            branchName: branchNameById.get(complaint.branch_id) ?? "",
            tableLabel: complaint.table_id ? (tableLabelById.get(complaint.table_id) ?? null) : null,
            type: complaint.type,
            message: complaint.message,
            customerName: complaint.customer_name,
            customerPhone: complaint.customer_phone,
            createdAt: complaint.created_at,
          }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
