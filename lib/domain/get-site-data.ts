import { createClient } from "@/lib/supabase/server";

// المنصة أحادية المطعم حالياً (راجع تأكيد المستخدم في تخطيط المرحلة 16) —
// الموقع العام لا يحتاج معرّف مطعم في الرابط، فقط أول مطعم غير محذوف.
export interface SiteRestaurant {
  id: string;
  nameAr: string;
  nameEn: string;
  logoUrl: string | null;
  aboutAr: string | null;
  aboutEn: string | null;
  heroImageUrl: string | null;
}

export interface SiteBranch {
  id: string;
  nameAr: string;
  nameEn: string;
  addressAr: string | null;
  addressEn: string | null;
  phone: string | null;
  googleMapsUrl: string | null;
  timezone: string;
}

export async function getSiteData(): Promise<{
  restaurant: SiteRestaurant;
  branches: SiteBranch[];
} | null> {
  const supabase = await createClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name_ar, name_en, logo_url, about_ar, about_en, hero_image_url")
    .is("deleted_at", null)
    .limit(1)
    .single();
  if (!restaurant) return null;

  const { data: branches } = await supabase
    .from("branches")
    .select("id, name_ar, name_en, address_ar, address_en, phone, google_maps_url, timezone")
    .eq("restaurant_id", restaurant.id)
    .is("deleted_at", null)
    .order("name_ar");

  return {
    restaurant: {
      id: restaurant.id,
      nameAr: restaurant.name_ar,
      nameEn: restaurant.name_en,
      logoUrl: restaurant.logo_url,
      aboutAr: restaurant.about_ar,
      aboutEn: restaurant.about_en,
      heroImageUrl: restaurant.hero_image_url,
    },
    branches: (branches ?? []).map((b) => ({
      id: b.id,
      nameAr: b.name_ar,
      nameEn: b.name_en,
      addressAr: b.address_ar,
      addressEn: b.address_en,
      phone: b.phone,
      googleMapsUrl: b.google_maps_url,
      timezone: b.timezone,
    })),
  };
}
