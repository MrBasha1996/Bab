import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getLocale } from "next-intl/server";
import { resolveBranch } from "@/lib/domain/resolve-branch";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInFlow } from "@/components/loyalty-public/GoogleSignInFlow";
import { PhoneEntryForm } from "@/components/loyalty-public/PhoneEntryForm";
import { LoyaltyDashboard } from "@/components/loyalty-public/LoyaltyDashboard";
import type { Locale } from "@/i18n/request";

export default async function LoyaltyPage({ params }: PageProps<"/m/[branchSlug]/loyalty">) {
  const { branchSlug } = await params;
  const resolved = await resolveBranch(branchSlug);
  if (!resolved) notFound();

  const locale = (await getLocale()) as Locale;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <GoogleSignInFlow branchSlug={branchSlug} />
      </div>
    );
  }

  const { data: member } = await supabase
    .from("loyalty_members")
    .select("id, points_balance")
    .eq("restaurant_id", resolved.restaurantId)
    .eq("auth_user_id", user.id)
    .single();

  if (!member) {
    return (
      <div className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-10">
        <PhoneEntryForm restaurantId={resolved.restaurantId} />
      </div>
    );
  }

  const [{ data: tiers }, { data: rewards }, { data: submissions }, { data: redemptions }] =
    await Promise.all([
      supabase
        .from("loyalty_tiers")
        .select("id, name_ar, name_en, min_points")
        .eq("restaurant_id", resolved.restaurantId)
        .order("min_points", { ascending: true }),
      supabase
        .from("loyalty_rewards")
        .select("id, name_ar, name_en, points_cost")
        .eq("restaurant_id", resolved.restaurantId)
        .eq("is_active", true)
        .order("points_cost", { ascending: true }),
      supabase
        .from("loyalty_receipt_submissions")
        .select("id, extracted_amount, points_awarded, status, created_at")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("loyalty_redemptions")
        .select("id, reward_id, points_spent, status, created_at")
        .eq("member_id", member.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

  const redemptionRewardIds = [...new Set((redemptions ?? []).map((r) => r.reward_id))];
  const { data: redemptionRewards } =
    redemptionRewardIds.length > 0
      ? await supabase.from("loyalty_rewards").select("id, name_ar, name_en").in("id", redemptionRewardIds)
      : { data: [] as { id: string; name_ar: string; name_en: string }[] };
  const redemptionRewardById = new Map((redemptionRewards ?? []).map((r) => [r.id, r]));

  const history = [
    ...(submissions ?? []).map((s) => ({
      id: s.id,
      type: "earn" as const,
      label: null,
      points: s.points_awarded,
      status: s.status as "pending_ocr" | "approved" | "rejected",
      createdAt: s.created_at,
    })),
    ...(redemptions ?? []).map((r) => {
      const reward = redemptionRewardById.get(r.reward_id);
      return {
        id: r.id,
        type: "redeem" as const,
        label: reward ? (locale === "ar" ? reward.name_ar : reward.name_en) : null,
        points: r.points_spent,
        status: r.status as "pending" | "fulfilled" | "cancelled",
        createdAt: r.created_at,
      };
    }),
  ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const scanUrl = `${siteUrl}/loyalty/scan/${member.id}`;
  const qrDataUrl = await QRCode.toDataURL(scanUrl, { margin: 1, width: 280 });

  return (
    <div className="mx-auto min-h-dvh max-w-md px-4 py-6">
      <LoyaltyDashboard
        memberId={member.id}
        branchId={resolved.branch.id}
        pointsBalance={member.points_balance}
        qrDataUrl={qrDataUrl}
        isArabic={locale === "ar"}
        tiers={(tiers ?? []).map((tier) => ({
          id: tier.id,
          nameAr: tier.name_ar,
          nameEn: tier.name_en,
          minPoints: tier.min_points,
        }))}
        rewards={(rewards ?? []).map((reward) => ({
          id: reward.id,
          nameAr: reward.name_ar,
          nameEn: reward.name_en,
          pointsCost: reward.points_cost,
        }))}
        history={history}
      />
    </div>
  );
}
