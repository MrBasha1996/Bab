import { createClient } from "@/lib/supabase/server";

// نسخة مبسّطة عن resolveTable (لا تحتاج qrToken/طاولة) — العضوية والنقاط على
// مستوى المطعم لا الفرع، فصفحة الولاء العامة تحتاج فقط تحديد المطعم عبر
// الفرع الحالي، بلا حل طاولة/QR.
export interface ResolvedBranch {
  restaurantId: string;
  restaurant: { nameAr: string; nameEn: string; logoUrl: string | null };
  branch: { id: string; nameAr: string; nameEn: string };
}

export async function resolveBranch(branchSlug: string): Promise<ResolvedBranch | null> {
  const supabase = await createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("id, restaurant_id, name_ar, name_en")
    .eq("slug", branchSlug)
    .is("deleted_at", null)
    .single();
  if (!branch) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name_ar, name_en, logo_url")
    .eq("id", branch.restaurant_id)
    .single();
  if (!restaurant) return null;

  return {
    restaurantId: branch.restaurant_id,
    restaurant: { nameAr: restaurant.name_ar, nameEn: restaurant.name_en, logoUrl: restaurant.logo_url },
    branch: { id: branch.id, nameAr: branch.name_ar, nameEn: branch.name_en },
  };
}
