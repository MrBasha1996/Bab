import { getTranslations } from "next-intl/server";
import { requireCapability } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { LoyaltyTabs } from "@/components/loyalty/LoyaltyTabs";
import { LoyaltySettingsForm } from "@/components/loyalty/LoyaltySettingsForm";
import { LoyaltyTiersPanel } from "@/components/loyalty/LoyaltyTiersPanel";
import { LoyaltyRewardsPanel } from "@/components/loyalty/LoyaltyRewardsPanel";

export default async function LoyaltySettingsPage() {
  await requireCapability("manage_loyalty");
  const t = await getTranslations("loyalty.pages");
  const supabase = await createClient();

  const { data: restaurantId } = await supabase.rpc("auth_restaurant_id");

  const [{ data: settings }, { data: tiers }, { data: rewards }] = await Promise.all([
    supabase
      .from("loyalty_settings")
      .select("points_per_currency_unit")
      .eq("restaurant_id", restaurantId ?? "")
      .maybeSingle(),
    supabase
      .from("loyalty_tiers")
      .select("id, name_ar, name_en, min_points")
      .eq("restaurant_id", restaurantId ?? "")
      .order("min_points", { ascending: true }),
    supabase
      .from("loyalty_rewards")
      .select("id, name_ar, name_en, points_cost, is_active")
      .eq("restaurant_id", restaurantId ?? "")
      .order("points_cost", { ascending: true }),
  ]);

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title={t("settingsTitle")} description={t("settingsDescription")} />
      <LoyaltyTabs active="/loyalty/settings" />
      <LoyaltySettingsForm
        defaultValues={{ pointsPerCurrencyUnit: settings?.points_per_currency_unit ?? 1 }}
      />
      <LoyaltyTiersPanel
        tiers={(tiers ?? []).map((tier) => ({
          id: tier.id,
          nameAr: tier.name_ar,
          nameEn: tier.name_en,
          minPoints: tier.min_points,
        }))}
      />
      <LoyaltyRewardsPanel
        rewards={(rewards ?? []).map((reward) => ({
          id: reward.id,
          nameAr: reward.name_ar,
          nameEn: reward.name_en,
          pointsCost: reward.points_cost,
          isActive: reward.is_active,
        }))}
      />
    </div>
  );
}
