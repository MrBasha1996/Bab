import { createClient } from "@/lib/supabase/server";

// يحل branchSlug + qrToken إلى الفرع/الطاولة عبر عميل anon (استعلامات منفصلة
// بدل embed-join، بنفس اتفاقية lib/auth/getProfile — النوع اليدوي لـDatabase
// لا يحمل Relationships الكاملة اللازمة لأنواع embed). يُستخدم من صفحتي
// QR والـTablet معاً لتجنّب تكرار المنطق.
export interface ResolvedTable {
  restaurant: { id: string; nameAr: string; nameEn: string; logoUrl: string | null };
  branch: {
    id: string;
    nameAr: string;
    nameEn: string;
    timezone: string;
    slug: string;
    googleReviewsUrl: string | null;
  };
  table: { id: string; labelAr: string; labelEn: string };
  qrCodeId: string;
}

export async function resolveTable(branchSlug: string, qrToken: string): Promise<ResolvedTable | null> {
  const supabase = await createClient();

  const { data: branch } = await supabase
    .from("branches")
    .select("id, restaurant_id, name_ar, name_en, timezone, slug, google_reviews_url")
    .eq("slug", branchSlug)
    .is("deleted_at", null)
    .single();
  if (!branch) return null;

  const { data: qr } = await supabase
    .from("table_qr_codes")
    .select("id, table_id, branch_id")
    .eq("qr_token", qrToken)
    .eq("is_active", true)
    .single();
  if (!qr || qr.branch_id !== branch.id) return null;

  const { data: table } = await supabase
    .from("tables")
    .select("id, label_ar, label_en")
    .eq("id", qr.table_id)
    .is("deleted_at", null)
    .single();
  if (!table) return null;

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name_ar, name_en, logo_url")
    .eq("id", branch.restaurant_id)
    .single();
  if (!restaurant) return null;

  return {
    restaurant: {
      id: restaurant.id,
      nameAr: restaurant.name_ar,
      nameEn: restaurant.name_en,
      logoUrl: restaurant.logo_url,
    },
    branch: {
      id: branch.id,
      nameAr: branch.name_ar,
      nameEn: branch.name_en,
      timezone: branch.timezone,
      slug: branch.slug,
      googleReviewsUrl: branch.google_reviews_url,
    },
    table: { id: table.id, labelAr: table.label_ar, labelEn: table.label_en },
    qrCodeId: qr.id,
  };
}
