import { getTranslations } from "next-intl/server";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LoyaltyTabs } from "@/components/loyalty/LoyaltyTabs";
import { SubmissionsTable } from "@/components/loyalty/SubmissionsTable";

// بلا فلترة branch_id يدوية هنا — سياسة RLS (auth_branch_ids() + manage_loyalty)
// تتكفّل بالنطاق الصحيح تلقائياً لكل من owner (كل فروع مطعمه) وbranch_manager
// (فرعه فقط)، بنفس مبدأ صفحات القوائم الأخرى في المشروع.
export default async function LoyaltySubmissionsPage() {
  await requireCapability("manage_loyalty");
  const t = await getTranslations("loyalty.pages");
  const supabase = await createClient();

  const { data: rows } = await supabase
    .from("loyalty_receipt_submissions")
    .select("id, member_id, branch_id, extracted_amount, invoice_number, points_awarded, status, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const submissions = rows ?? [];
  const memberIds = [...new Set(submissions.map((r) => r.member_id))];
  const branchIds = [...new Set(submissions.map((r) => r.branch_id))];

  const [{ data: members }, { data: branches }] = await Promise.all([
    memberIds.length > 0
      ? supabase.from("loyalty_members").select("id, phone").in("id", memberIds)
      : Promise.resolve({ data: [] as { id: string; phone: string }[] }),
    branchIds.length > 0
      ? supabase.from("branches").select("id, name_ar, name_en").in("id", branchIds)
      : Promise.resolve({ data: [] as { id: string; name_ar: string; name_en: string }[] }),
  ]);

  const memberById = new Map((members ?? []).map((m) => [m.id, m]));
  const branchById = new Map((branches ?? []).map((b) => [b.id, b]));

  const tableRows = submissions.map((r) => ({
    id: r.id,
    memberPhone: memberById.get(r.member_id)?.phone ?? "—",
    branchNameAr: branchById.get(r.branch_id)?.name_ar ?? "—",
    branchNameEn: branchById.get(r.branch_id)?.name_en ?? "—",
    extractedAmount: r.extracted_amount,
    invoiceNumber: r.invoice_number,
    pointsAwarded: r.points_awarded,
    status: r.status,
    createdAt: r.created_at,
  }));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title={t("submissionsTitle")} description={t("submissionsDescription")} />
      <LoyaltyTabs active="/loyalty/submissions" />
      {tableRows.length > 0 ? (
        <SubmissionsTable rows={tableRows} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}
    </div>
  );
}
