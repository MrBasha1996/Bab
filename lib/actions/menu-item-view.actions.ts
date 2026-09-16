"use server";
import { createClient } from "@/lib/supabase/server";

// تسجيل فتح تفاصيل صنف من المنيو العامة: أفضل جهد، لا يُفشِل الواجهة إن
// تعذّر (تحليلي بحت، بنية تحتية للمرحلة 13 — لا لوحة عرض بعد).
export async function recordMenuItemView(
  branchId: string,
  menuItemId: string,
  tableId: string | null,
  source: "qr" | "tablet" | "site"
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("menu_item_view_events")
    .insert({ branch_id: branchId, menu_item_id: menuItemId, table_id: tableId, source });
}
