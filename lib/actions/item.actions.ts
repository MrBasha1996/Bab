"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidDataError } from "@/lib/i18n/action-messages";
import { itemSchema, type ItemInput } from "@/lib/validation/item.schema";
import type { ActionResult } from "@/lib/actions/types";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// يستبدل كل العلاقات الفرعية للصنف (فئات/variants/option groups+values/مسبِّبات)
// بالكامل عند كل حفظ — أبسط من دمج فروقات جزئية، ومقبول لأن لا تعديل متزامن
// متوقَّع على نفس الصنف من أكثر من مستخدم في هذا الحجم من المشروع.
async function replaceItemChildren(
  supabase: SupabaseClient<Database>,
  itemId: string,
  branchId: string,
  data: ItemInput
): Promise<string | null> {
  const deletes = await Promise.all([
    supabase.from("menu_category_items").delete().eq("item_id", itemId),
    supabase.from("item_variants").delete().eq("item_id", itemId),
    supabase.from("option_groups").delete().eq("item_id", itemId),
    supabase.from("item_allergens").delete().eq("item_id", itemId),
  ]);
  const deleteError = deletes.find((r) => r.error)?.error;
  if (deleteError) return deleteError.message;

  if (data.categoryIds.length > 0) {
    const { error } = await supabase.from("menu_category_items").insert(
      data.categoryIds.map((categoryId, i) => ({
        category_id: categoryId,
        item_id: itemId,
        branch_id: branchId,
        sort_order: i,
      }))
    );
    if (error) return error.message;
  }

  if (data.variants.length > 0) {
    const { error } = await supabase.from("item_variants").insert(
      data.variants.map((v, i) => ({
        item_id: itemId,
        branch_id: branchId,
        name_ar: v.nameAr,
        name_en: v.nameEn,
        price: v.price,
        sort_order: i,
      }))
    );
    if (error) return error.message;
  }

  if (data.allergenIds.length > 0) {
    const { error } = await supabase.from("item_allergens").insert(
      data.allergenIds.map((allergenId) => ({ item_id: itemId, allergen_id: allergenId, branch_id: branchId }))
    );
    if (error) return error.message;
  }

  for (const [gi, group] of data.optionGroups.entries()) {
    const { data: insertedGroup, error: groupError } = await supabase
      .from("option_groups")
      .insert({
        item_id: itemId,
        branch_id: branchId,
        name_ar: group.nameAr,
        name_en: group.nameEn,
        is_required: group.isRequired,
        min_select: group.minSelect,
        max_select: group.maxSelect,
        sort_order: gi,
      })
      .select("id")
      .single();
    if (groupError || !insertedGroup) return groupError?.message ?? "error";

    const { error: valuesError } = await supabase.from("option_values").insert(
      group.values.map((v, vi) => ({
        option_group_id: insertedGroup.id,
        branch_id: branchId,
        name_ar: v.nameAr,
        name_en: v.nameEn,
        price_delta: v.priceDelta,
        sort_order: vi,
      }))
    );
    if (valuesError) return valuesError.message;
  }

  return null;
}

export async function createItem(input: ItemInput): Promise<ActionResult> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { data: item, error } = await supabase
    .from("menu_items")
    .insert({
      branch_id: parsed.data.branchId,
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
      description_ar: parsed.data.descriptionAr || null,
      description_en: parsed.data.descriptionEn || null,
      price: parsed.data.price,
      calories: parsed.data.calories ?? null,
      is_splittable: parsed.data.isSplittable,
    })
    .select("id")
    .single();

  if (error || !item) return { success: false, error: error?.message };

  const childError = await replaceItemChildren(supabase, item.id, parsed.data.branchId, parsed.data);
  if (childError) return { success: false, error: childError };

  revalidatePath("/items");
  redirect(`/items/${item.id}`);
}

export async function updateItem(id: string, input: ItemInput): Promise<ActionResult> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update({
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
      description_ar: parsed.data.descriptionAr || null,
      description_en: parsed.data.descriptionEn || null,
      price: parsed.data.price,
      calories: parsed.data.calories ?? null,
      is_splittable: parsed.data.isSplittable,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  const childError = await replaceItemChildren(supabase, id, parsed.data.branchId, parsed.data);
  if (childError) return { success: false, error: childError };

  revalidatePath("/items");
  revalidatePath(`/items/${id}`);
  return { success: true };
}

export async function uploadItemImage(itemId: string, formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  // نتحقق من صلاحية manage_items عبر عميل مصادَق قبل أي رفع — التخزين نفسه
  // ليس له سياسات RLS مضبوطة بعد (خارج نطاق هذه المرحلة)، فعميل admin يتجاوزها
  // عمداً هنا فقط بعد التحقق اليدوي أدناه من صلاحية المستخدم.
  const { data: item } = await supabase.from("menu_items").select("branch_id").eq("id", itemId).single();
  if (!item) return { success: false, error: await invalidDataError() };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${item.branch_id}/${itemId}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("menu-images")
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: uploadError.message };

  const { data: publicUrl } = admin.storage.from("menu-images").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("menu_items")
    .update({ image_url: publicUrl.publicUrl })
    .eq("id", itemId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath(`/items/${itemId}`);
  return { success: true };
}

export async function toggleItemAvailability(itemId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("toggle_item_availability", { p_item_id: itemId });
  if (error) return { success: false, error: error.message };

  revalidatePath("/items");
  revalidatePath(`/items/${itemId}`);
  return { success: true };
}
