import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ScanRedemptionActions } from "@/components/loyalty/ScanRedemptionActions";
import { StaffRedeemRewards } from "@/components/loyalty/StaffRedeemRewards";
import type { Locale } from "@/i18n/request";

export default async function LoyaltyScanPage({ params }: PageProps<"/loyalty/scan/[memberId]">) {
  await requireCapability("manage_loyalty");
  const { memberId } = await params;
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("loyalty.scan");
  const supabase = await createClient();

  // بلا فلترة restaurant_id يدوية — سياسة loyalty_members_select_staff
  // (auth_restaurant_id() + manage_loyalty) تمنع الموظف من رؤية عضو
  // خارج مطعمه، فتُعيد .single() صفراً بدلاً منه.
  const { data: member } = await supabase
    .from("loyalty_members")
    .select("id, phone, points_balance, restaurant_id")
    .eq("id", memberId)
    .single();

  if (!member) notFound();

  const [{ data: tiers }, { data: redemptions }, { data: activeRewards }] = await Promise.all([
    supabase
      .from("loyalty_tiers")
      .select("id, name_ar, name_en, min_points")
      .eq("restaurant_id", member.restaurant_id)
      .order("min_points", { ascending: true }),
    supabase
      .from("loyalty_redemptions")
      .select("id, reward_id, points_spent, created_at")
      .eq("member_id", member.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false }),
    supabase
      .from("loyalty_rewards")
      .select("id, name_ar, name_en, points_cost")
      .eq("restaurant_id", member.restaurant_id)
      .eq("is_active", true)
      .order("points_cost", { ascending: true }),
  ]);

  const rewardIds = [...new Set((redemptions ?? []).map((r) => r.reward_id))];
  const { data: rewards } =
    rewardIds.length > 0
      ? await supabase.from("loyalty_rewards").select("id, name_ar, name_en").in("id", rewardIds)
      : { data: [] as { id: string; name_ar: string; name_en: string }[] };
  const rewardById = new Map((rewards ?? []).map((r) => [r.id, r]));

  const currentTier = [...(tiers ?? [])]
    .sort((a, b) => b.min_points - a.min_points)
    .find((tier) => member.points_balance >= tier.min_points);

  return (
    <div className="mx-auto grid max-w-md gap-6 p-6">
      <PageHeader backHref="/loyalty/redemptions" title={t("title")} />

      <div className="rounded-xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 text-center">
        <p dir="ltr" className="text-sm text-muted-foreground">
          {member.phone}
        </p>
        <p className="mt-2 text-5xl font-bold text-primary">{member.points_balance}</p>
        <p className="text-sm text-muted-foreground">{t("pointsLabel")}</p>
        {currentTier && (
          <p className="mt-2 text-sm font-medium">
            {t("currentTier", { tier: isAr ? currentTier.name_ar : currentTier.name_en })}
          </p>
        )}
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">{t("redeemTitle")}</p>
        <StaffRedeemRewards
          memberId={member.id}
          pointsBalance={member.points_balance}
          rewards={(activeRewards ?? []).map((r) => ({
            id: r.id,
            name: isAr ? r.name_ar : r.name_en,
            pointsCost: r.points_cost,
          }))}
        />
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">{t("pendingRedemptions")}</p>
        {(redemptions ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">{t("noPending")}</p>
        )}
        {(redemptions ?? []).map((r) => {
          const reward = rewardById.get(r.reward_id);
          return (
            <ScanRedemptionActions
              key={r.id}
              redemptionId={r.id}
              rewardName={reward ? (isAr ? reward.name_ar : reward.name_en) : "—"}
              pointsSpent={r.points_spent}
            />
          );
        })}
      </div>
    </div>
  );
}
