import { createClient } from "@/lib/supabase/server";
import { isMenuActiveNow, type MenuScheduleRow } from "@/lib/domain/menu-schedule";

export interface PublicOptionValue {
  id: string;
  nameAr: string;
  nameEn: string;
  priceDelta: number;
}

export interface PublicOptionGroup {
  id: string;
  nameAr: string;
  nameEn: string;
  isRequired: boolean;
  minSelect: number;
  maxSelect: number;
  values: PublicOptionValue[];
}

export interface PublicVariant {
  id: string;
  nameAr: string;
  nameEn: string;
  price: number;
}

export interface PublicItem {
  id: string;
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  price: number;
  calories: number | null;
  imageUrl: string | null;
  isSplittable: boolean;
  categoryIds: string[];
  variants: PublicVariant[];
  optionGroups: PublicOptionGroup[];
  allergenIds: string[];
}

export interface PublicCategory {
  id: string;
  nameAr: string;
  nameEn: string;
  items: PublicItem[];
}

export interface PublicAllergen {
  id: string;
  nameAr: string;
  nameEn: string;
  iconUrl: string | null;
}

// يجمع فئات/أصناف كل القوائم النشطة الآن (حسب menu_schedules بتوقيت الفرع)
// لفرع معيّن، عبر عميل anon — RLS على menu_items يستثني تلقائياً غير
// المتوفر/المخفي، فلا حاجة لفلترة إضافية هنا.
export async function getActiveMenuTree(
  branchId: string,
  timezone: string
): Promise<{ categories: PublicCategory[]; allergens: PublicAllergen[] }> {
  const supabase = await createClient();

  const { data: menus } = await supabase
    .from("menus")
    .select("id")
    .eq("branch_id", branchId)
    .is("deleted_at", null);
  if (!menus || menus.length === 0) return { categories: [], allergens: [] };

  const menuIds = menus.map((m) => m.id);
  const { data: schedules } = await supabase
    .from("menu_schedules")
    .select("menu_id, day_of_week, start_time, end_time")
    .in("menu_id", menuIds);

  const schedulesByMenu = new Map<string, MenuScheduleRow[]>();
  for (const row of schedules ?? []) {
    const list = schedulesByMenu.get(row.menu_id) ?? [];
    list.push({ dayOfWeek: row.day_of_week, startTime: row.start_time, endTime: row.end_time });
    schedulesByMenu.set(row.menu_id, list);
  }

  const activeMenuIds = menuIds.filter((id) => isMenuActiveNow(schedulesByMenu.get(id) ?? [], timezone));
  if (activeMenuIds.length === 0) return { categories: [], allergens: [] };

  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name_ar, name_en, sort_order")
    .in("menu_id", activeMenuIds)
    .is("deleted_at", null)
    .order("sort_order");
  if (!categories || categories.length === 0) return { categories: [], allergens: [] };

  const categoryIds = categories.map((c) => c.id);
  const { data: categoryItems } = await supabase
    .from("menu_category_items")
    .select("category_id, item_id, sort_order")
    .in("category_id", categoryIds)
    .order("sort_order");

  const itemIds = [...new Set((categoryItems ?? []).map((ci) => ci.item_id))];
  if (itemIds.length === 0) {
    return { categories: categories.map((c) => ({ id: c.id, nameAr: c.name_ar, nameEn: c.name_en, items: [] })), allergens: [] };
  }

  const [{ data: items }, { data: variants }, { data: optionGroups }, { data: itemAllergens }, { data: allAllergens }] =
    await Promise.all([
      supabase.from("menu_items").select("*").in("id", itemIds),
      supabase.from("item_variants").select("*").in("item_id", itemIds).order("sort_order"),
      supabase.from("option_groups").select("*").in("item_id", itemIds).order("sort_order"),
      supabase.from("item_allergens").select("item_id, allergen_id").in("item_id", itemIds),
      supabase.from("allergens").select("*"),
    ]);

  const visibleItemIds = new Set((items ?? []).map((i) => i.id));

  const groupIds = (optionGroups ?? []).map((g) => g.id);
  const { data: optionValues } =
    groupIds.length > 0
      ? await supabase.from("option_values").select("*").in("option_group_id", groupIds).order("sort_order")
      : { data: [] };

  const variantsByItem = new Map<string, PublicVariant[]>();
  for (const v of variants ?? []) {
    const list = variantsByItem.get(v.item_id) ?? [];
    list.push({ id: v.id, nameAr: v.name_ar, nameEn: v.name_en, price: v.price });
    variantsByItem.set(v.item_id, list);
  }

  const valuesByGroup = new Map<string, PublicOptionValue[]>();
  for (const v of optionValues ?? []) {
    const list = valuesByGroup.get(v.option_group_id) ?? [];
    list.push({ id: v.id, nameAr: v.name_ar, nameEn: v.name_en, priceDelta: v.price_delta });
    valuesByGroup.set(v.option_group_id, list);
  }

  const groupsByItem = new Map<string, PublicOptionGroup[]>();
  for (const g of optionGroups ?? []) {
    const list = groupsByItem.get(g.item_id) ?? [];
    list.push({
      id: g.id,
      nameAr: g.name_ar,
      nameEn: g.name_en,
      isRequired: g.is_required,
      minSelect: g.min_select,
      maxSelect: g.max_select,
      values: valuesByGroup.get(g.id) ?? [],
    });
    groupsByItem.set(g.item_id, list);
  }

  const categoryIdsByItem = new Map<string, string[]>();
  for (const ci of categoryItems ?? []) {
    const list = categoryIdsByItem.get(ci.item_id) ?? [];
    list.push(ci.category_id);
    categoryIdsByItem.set(ci.item_id, list);
  }

  const allergenIdsByItem = new Map<string, string[]>();
  const usedAllergenIds = new Set<string>();
  for (const ia of itemAllergens ?? []) {
    if (!visibleItemIds.has(ia.item_id)) continue;
    const list = allergenIdsByItem.get(ia.item_id) ?? [];
    list.push(ia.allergen_id);
    allergenIdsByItem.set(ia.item_id, list);
    usedAllergenIds.add(ia.allergen_id);
  }

  const itemsById = new Map<string, PublicItem>();
  for (const i of items ?? []) {
    itemsById.set(i.id, {
      id: i.id,
      nameAr: i.name_ar,
      nameEn: i.name_en,
      descriptionAr: i.description_ar,
      descriptionEn: i.description_en,
      price: i.price,
      calories: i.calories,
      imageUrl: i.image_url,
      isSplittable: i.is_splittable,
      categoryIds: categoryIdsByItem.get(i.id) ?? [],
      variants: variantsByItem.get(i.id) ?? [],
      optionGroups: groupsByItem.get(i.id) ?? [],
      allergenIds: allergenIdsByItem.get(i.id) ?? [],
    });
  }

  const itemsByCategory = new Map<string, PublicItem[]>();
  for (const ci of categoryItems ?? []) {
    const item = itemsById.get(ci.item_id);
    if (!item) continue;
    const list = itemsByCategory.get(ci.category_id) ?? [];
    list.push(item);
    itemsByCategory.set(ci.category_id, list);
  }

  const resultCategories = categories
    .map((c) => ({
      id: c.id,
      nameAr: c.name_ar,
      nameEn: c.name_en,
      items: itemsByCategory.get(c.id) ?? [],
    }))
    .filter((c) => c.items.length > 0);

  const resultAllergens = (allAllergens ?? [])
    .filter((a) => usedAllergenIds.has(a.id))
    .map((a) => ({ id: a.id, nameAr: a.name_ar, nameEn: a.name_en, iconUrl: a.icon_url }));

  return { categories: resultCategories, allergens: resultAllergens };
}
