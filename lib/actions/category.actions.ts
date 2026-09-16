"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import { categorySchema, type CategoryInput } from "@/lib/validation/category.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { data: category, error } = await supabase
    .from("menu_categories")
    .insert({
      menu_id: parsed.data.menuId,
      branch_id: parsed.data.branchId,
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
      sort_order: parsed.data.sortOrder,
    })
    .select("id")
    .single();

  if (error || !category) return { success: false, error: error?.message };

  revalidatePath(`/menus/${parsed.data.menuId}`);
  redirect(`/menus/${parsed.data.menuId}/categories/${category.id}`);
}

export async function addItemToCategory(
  categoryId: string,
  itemId: string,
  branchId: string,
  menuId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: existingLinks } = await supabase
    .from("menu_category_items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1);

  const nextSortOrder = (existingLinks?.[0]?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("menu_category_items")
    .insert({ category_id: categoryId, item_id: itemId, branch_id: branchId, sort_order: nextSortOrder });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/menus/${menuId}/categories/${categoryId}`);
  return { success: true };
}

export async function removeItemFromCategory(categoryId: string, itemId: string, menuId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_category_items")
    .delete()
    .eq("category_id", categoryId)
    .eq("item_id", itemId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/menus/${menuId}/categories/${categoryId}`);
  return { success: true };
}

export async function updateCategory(id: string, menuId: string, input: CategoryInput): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .update({ name_ar: parsed.data.nameAr, name_en: parsed.data.nameEn, sort_order: parsed.data.sortOrder })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/menus/${menuId}`);
  revalidatePath(`/menus/${menuId}/categories/${id}`);
  return { success: true };
}
