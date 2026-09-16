import { getTranslations } from "next-intl/server";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LoyaltyTabs } from "@/components/loyalty/LoyaltyTabs";
import { RedemptionsTable } from "@/components/loyalty/RedemptionsTable";

export default async function LoyaltyRedemptionsPage() {
  await requireCapability("manage_loyalty");
  const t = await getTranslations("loyalty.pages");
  const supabase = await createClient();

  // بلا فلترة restaurant_id يدوية — سياسة RLS (auth_restaurant_id() +
  // manage_loyalty) تتكفّل بالنطاق الصحيح تلقائياً.
  const { data: redemptions } = await supabase
    .from("loyalty_redemptions")
    .select("id, member_id, reward_id, points_spent, status, created_at")
    .order("created_at", { ascending: false });

  const memberIds = [...new Set((redemptions ?? []).map((r) => r.member_id))];
  const rewardIds = [...new Set((redemptions ?? []).map((r) => r.reward_id))];

  const [{ data: members }, { data: rewards }] = await Promise.all([
    memberIds.length > 0
      ? supabase.from("loyalty_members").select("id, phone").in("id", memberIds)
      : Promise.resolve({ data: [] as { id: string; phone: string }[] }),
    rewardIds.length > 0
      ? supabase.from("loyalty_rewards").select("id, name_ar, name_en").in("id", rewardIds)
      : Promise.resolve({ data: [] as { id: string; name_ar: string; name_en: string }[] }),
  ]);

  const memberById = new Map((members ?? []).map((m) => [m.id, m]));
  const rewardById = new Map((rewards ?? []).map((r) => [r.id, r]));

  const rows = (redemptions ?? []).map((r) => ({
    id: r.id,
    memberPhone: memberById.get(r.member_id)?.phone ?? "—",
    rewardNameAr: rewardById.get(r.reward_id)?.name_ar ?? "—",
    rewardNameEn: rewardById.get(r.reward_id)?.name_en ?? "—",
    pointsSpent: r.points_spent,
    status: r.status,
    createdAt: r.created_at,
  }));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title={t("redemptionsTitle")} description={t("redemptionsDescription")} />
      <LoyaltyTabs active="/loyalty/redemptions" />
      {rows.length > 0 ? <RedemptionsTable rows={rows} /> : <p className="text-sm text-muted-foreground">{t("empty")}</p>}
    </div>
  );
}
