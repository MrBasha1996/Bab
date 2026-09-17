import { createClient } from "@/lib/supabase/server";

// نسخة مبسّطة عن resolveTable (لا تحتاج qrToken/طاولة) — العضوية والنقاط على
// مستوى المطعم لا الفرع، فصفحة الولاء العامة تحتاج فقط تحديد المطعم عبر
// الفرع الحالي، بلا حل طاولة/QR.
export interface ResolvedBranch {
  restaurantId: string;
  restaurant: { nameAr: string; nameEn: string; logoUrl: string | null };
  branch: { id: string; nameAr: string; nameEn: string };
}

// يستدعي resolve_branch_public (RPC، راجع 0027_fix_public_resolve_via_rpc.sql)
// بدل قراءة مباشرة من branches/restaurants — سياسات RLS العامة على هذين
// الجدولين مقيَّدة بدور anon فقط، فعميل ولاء مسجّل دخوله فعلياً (دور
// authenticated غير موظف) لا يرى أي صف عبرها ويحصل دائماً على null/404.
export async function resolveBranch(branchSlug: string): Promise<ResolvedBranch | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("resolve_branch_public", { p_branch_slug: branchSlug }).maybeSingle();
  if (!data) return null;

  return {
    restaurantId: data.restaurant_id,
    restaurant: {
      nameAr: data.restaurant_name_ar,
      nameEn: data.restaurant_name_en,
      logoUrl: data.restaurant_logo_url,
    },
    branch: { id: data.branch_id, nameAr: data.branch_name_ar, nameEn: data.branch_name_en },
  };
}
