import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { InquiriesListTable } from "@/components/inquiry/InquiriesListTable";

export default async function InquiriesPage() {
  await requireProfile();
  const t = await getTranslations("inquiries.pages");
  const supabase = await createClient();
  const [{ data: inquiries }, { data: branches }] = await Promise.all([
    supabase
      .from("inquiries")
      .select("id, branch_id, name, phone, subject, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("branches").select("id, name_ar"),
  ]);
  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name_ar]));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title={t("listTitle")} description={t("listDescription")} />
      {inquiries && inquiries.length > 0 ? (
        <InquiriesListTable
          rows={inquiries.map((inquiry) => ({
            id: inquiry.id,
            branchId: inquiry.branch_id,
            branchName: branchNameById.get(inquiry.branch_id) ?? "",
            name: inquiry.name,
            phone: inquiry.phone,
            subject: inquiry.subject,
            status: inquiry.status,
            createdAt: inquiry.created_at,
          }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
