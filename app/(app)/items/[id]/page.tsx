import { notFound } from "next/navigation";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ItemForm } from "@/components/item/ItemForm";
import { ItemImageUpload } from "@/components/item/ItemImageUpload";

export default async function ItemDetailPage({ params }: PageProps<"/items/[id]">) {
  await requireProfile();
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("menu_items")
    .select("id, branch_id, name_ar, name_en, description_ar, description_en, price, calories, image_url, is_splittable")
    .eq("id", id)
    .single();

  if (!item) notFound();

  const [
    { data: branches },
    { data: categories },
    { data: allergens },
    { data: categoryLinks },
    { data: variants },
    { data: optionGroups },
    { data: itemAllergens },
  ] = await Promise.all([
    supabase.from("branches").select("id, name_ar").order("name_ar"),
    supabase.from("menu_categories").select("id, branch_id, name_ar").is("deleted_at", null).order("name_ar"),
    supabase.from("allergens").select("id, name_ar").order("name_ar"),
    supabase.from("menu_category_items").select("category_id").eq("item_id", id),
    supabase.from("item_variants").select("id, name_ar, name_en, price").eq("item_id", id).order("sort_order"),
    supabase
      .from("option_groups")
      .select("id, name_ar, name_en, is_required, min_select, max_select")
      .eq("item_id", id)
      .order("sort_order"),
    supabase.from("item_allergens").select("allergen_id").eq("item_id", id),
  ]);

  const groupIds = (optionGroups ?? []).map((g) => g.id);
  const { data: optionValues } = groupIds.length
    ? await supabase
        .from("option_values")
        .select("id, option_group_id, name_ar, name_en, price_delta")
        .in("option_group_id", groupIds)
        .order("sort_order")
    : { data: [] };

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/items" title={item.name_ar} />
      <ItemImageUpload itemId={item.id} imageUrl={item.image_url} />
      <ItemForm
        itemId={item.id}
        branches={(branches ?? []).map((b) => ({ id: b.id, label: b.name_ar }))}
        categories={(categories ?? []).map((c) => ({ id: c.id, branchId: c.branch_id, label: c.name_ar }))}
        allergens={(allergens ?? []).map((a) => ({ id: a.id, label: a.name_ar }))}
        defaultValues={{
          branchId: item.branch_id,
          nameAr: item.name_ar,
          nameEn: item.name_en,
          descriptionAr: item.description_ar ?? "",
          descriptionEn: item.description_en ?? "",
          price: item.price,
          calories: item.calories ?? undefined,
          isSplittable: item.is_splittable,
          categoryIds: (categoryLinks ?? []).map((l) => l.category_id),
          allergenIds: (itemAllergens ?? []).map((a) => a.allergen_id),
          variants: (variants ?? []).map((v) => ({ id: v.id, nameAr: v.name_ar, nameEn: v.name_en, price: v.price })),
          optionGroups: (optionGroups ?? []).map((g) => ({
            id: g.id,
            nameAr: g.name_ar,
            nameEn: g.name_en,
            isRequired: g.is_required,
            minSelect: g.min_select,
            maxSelect: g.max_select,
            values: (optionValues ?? [])
              .filter((v) => v.option_group_id === g.id)
              .map((v) => ({ id: v.id, nameAr: v.name_ar, nameEn: v.name_en, priceDelta: v.price_delta })),
          })),
        }}
      />
    </div>
  );
}
