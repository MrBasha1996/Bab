import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { getProfile } from "@/lib/auth/getProfile";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { RestaurantSettingsForm } from "@/components/restaurant/RestaurantSettingsForm";
import { RestaurantHeroImageUpload } from "@/components/restaurant/RestaurantHeroImageUpload";

export default async function RestaurantSettingsPage() {
  await requireProfile();
  const profile = await getProfile();
  if (!profile?.restaurantId) notFound();

  const t = await getTranslations("restaurant.settings");
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name_ar, name_en, about_ar, about_en, hero_image_url")
    .eq("id", profile.restaurantId)
    .single();

  if (!restaurant) notFound();

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title={t("title")} />
      <RestaurantSettingsForm
        restaurantId={restaurant.id}
        defaultValues={{
          nameAr: restaurant.name_ar,
          nameEn: restaurant.name_en,
          aboutAr: restaurant.about_ar ?? "",
          aboutEn: restaurant.about_en ?? "",
        }}
      />
      <RestaurantHeroImageUpload restaurantId={restaurant.id} imageUrl={restaurant.hero_image_url} />
    </div>
  );
}
