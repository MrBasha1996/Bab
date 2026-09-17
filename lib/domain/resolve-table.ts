import { createClient } from "@/lib/supabase/server";

// يحل branchSlug + qrToken إلى الفرع/الطاولة عبر resolve_table_public (RPC،
// راجع 0027_fix_public_resolve_via_rpc.sql). يُستخدم من صفحتي QR والـTablet
// معاً لتجنّب تكرار المنطق.
export interface ResolvedTable {
  restaurant: { id: string; nameAr: string; nameEn: string; logoUrl: string | null };
  branch: {
    id: string;
    nameAr: string;
    nameEn: string;
    timezone: string;
    slug: string;
    googleReviewsUrl: string | null;
    googleMapsUrl: string | null;
  };
  table: { id: string; labelAr: string; labelEn: string };
  qrCodeId: string;
}

export async function resolveTable(branchSlug: string, qrToken: string): Promise<ResolvedTable | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .rpc("resolve_table_public", { p_branch_slug: branchSlug, p_qr_token: qrToken })
    .maybeSingle();
  if (!data) return null;

  return {
    restaurant: {
      id: data.restaurant_id,
      nameAr: data.restaurant_name_ar,
      nameEn: data.restaurant_name_en,
      logoUrl: data.restaurant_logo_url,
    },
    branch: {
      id: data.branch_id,
      nameAr: data.branch_name_ar,
      nameEn: data.branch_name_en,
      timezone: data.branch_timezone,
      slug: data.branch_slug,
      googleReviewsUrl: data.branch_google_reviews_url,
      googleMapsUrl: data.branch_google_maps_url,
    },
    table: { id: data.table_id, labelAr: data.table_label_ar, labelEn: data.table_label_en },
    qrCodeId: data.qr_code_id,
  };
}
