"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError, actionMsg } from "@/lib/i18n/action-messages";
import { preorderItemsSchema, type PreorderItemInput } from "@/lib/validation/preorder.schema";
import type { ActionResult } from "@/lib/actions/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// يتحقق أن كل سطر نصف/نصف (فيه secondMenuItemId) صالح: كلا الصنفين
// is_splittable=true فعلاً، ويتشاركان فئة واحدة على الأقل — لا يمكن فرض هذا
// بقيد DB مباشر بسبب علاقة menu_category_items N:N، فيُتحقَّق منه هنا سيرفرياً
// قبل أي إدراج.
async function validateHalfHalfItems(
  supabase: SupabaseClient<Database>,
  items: PreorderItemInput[]
): Promise<string | null> {
  const halfHalfItems = items.filter((item) => item.secondMenuItemId);
  if (halfHalfItems.length === 0) return null;

  const itemIds = [...new Set(halfHalfItems.flatMap((item) => [item.menuItemId, item.secondMenuItemId as string]))];
  const [{ data: menuItems }, { data: categoryLinks }] = await Promise.all([
    supabase.from("menu_items").select("id, is_splittable").in("id", itemIds),
    supabase.from("menu_category_items").select("item_id, category_id").in("item_id", itemIds),
  ]);

  const splittableById = new Map((menuItems ?? []).map((i) => [i.id, i.is_splittable]));
  const categoriesById = new Map<string, Set<string>>();
  for (const link of categoryLinks ?? []) {
    const set = categoriesById.get(link.item_id) ?? new Set<string>();
    set.add(link.category_id);
    categoriesById.set(link.item_id, set);
  }

  for (const item of halfHalfItems) {
    const secondId = item.secondMenuItemId as string;
    if (!splittableById.get(item.menuItemId) || !splittableById.get(secondId)) {
      return await actionMsg("common.halfHalfInvalid");
    }
    const firstCategories = categoriesById.get(item.menuItemId) ?? new Set<string>();
    const secondCategories = categoriesById.get(secondId) ?? new Set<string>();
    const sharesCategory = [...firstCategories].some((c) => secondCategories.has(c));
    if (!sharesCategory) return await actionMsg("common.halfHalfInvalid");
  }

  return null;
}

// يستبدل كل أصناف الحجز المطلوبة مسبقاً بالكامل عند كل حفظ — نفس نمط
// replaceItemChildren في item.actions.ts (بلا دمج جزئي، لا تعديل متزامن متوقَّع).
export async function replacePreorderItems(
  supabase: SupabaseClient<Database>,
  reservationId: string,
  branchId: string,
  items: PreorderItemInput[]
): Promise<string | null> {
  const validationError = await validateHalfHalfItems(supabase, items);
  if (validationError) return validationError;

  const { error: deleteError } = await supabase
    .from("reservation_preorder_items")
    .delete()
    .eq("reservation_id", reservationId);
  if (deleteError) return deleteError.message;

  if (items.length === 0) return null;

  const { error } = await supabase.from("reservation_preorder_items").insert(
    items.map((item) => ({
      reservation_id: reservationId,
      branch_id: branchId,
      menu_item_id: item.menuItemId,
      item_variant_id: item.itemVariantId || null,
      second_menu_item_id: item.secondMenuItemId || null,
      second_item_variant_id: item.secondItemVariantId || null,
      quantity: item.quantity,
      notes: item.notes || null,
    }))
  );
  return error?.message ?? null;
}

export async function updatePreorderItems(
  reservationId: string,
  branchId: string,
  input: PreorderItemInput[]
): Promise<ActionResult> {
  const parsed = preorderItemsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const error = await replacePreorderItems(supabase, reservationId, branchId, parsed.data);
  if (error) return { success: false, error };

  revalidatePath(`/reservations/${reservationId}`);
  return { success: true };
}
