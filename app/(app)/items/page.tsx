import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { ItemsListTable } from "@/components/item/ItemsListTable";

export default async function ItemsPage() {
  await requireProfile();
  const t = await getTranslations("menus.item.pages");
  const supabase = await createClient();
  const [{ data: items }, { data: branches }, { data: categories }, { data: categoryItems }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, branch_id, name_ar, price, image_url, is_available, is_visible")
      .is("deleted_at", null)
      .order("name_ar"),
    supabase.from("branches").select("id, name_ar"),
    supabase.from("menu_categories").select("id, name_ar").is("deleted_at", null),
    supabase.from("menu_category_items").select("item_id, category_id"),
  ]);
  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name_ar]));
  const categoryNameById = new Map((categories ?? []).map((c) => [c.id, c.name_ar]));
  const categoryIdsByItemId = new Map<string, string[]>();
  for (const ci of categoryItems ?? []) {
    const list = categoryIdsByItemId.get(ci.item_id) ?? [];
    list.push(ci.category_id);
    categoryIdsByItemId.set(ci.item_id, list);
  }

  return (
    <div className="grid gap-6 p-6">
      <PageHeader
        title={t("listTitle")}
        description={t("listDescription")}
        actions={
          <Button asChild>
            <Link href="/items/new">{t("addItem")}</Link>
          </Button>
        }
      />
      {items && items.length > 0 ? (
        <ItemsListTable
          rows={items.map((item) => {
            const categoryIds = categoryIdsByItemId.get(item.id) ?? [];
            return {
              id: item.id,
              branchId: item.branch_id,
              branchName: branchNameById.get(item.branch_id) ?? "",
              nameAr: item.name_ar,
              price: item.price,
              imageUrl: item.image_url,
              isAvailable: item.is_available,
              isVisible: item.is_visible,
              categoryIds,
              categoryNames: categoryIds.map((id) => categoryNameById.get(id) ?? "").filter(Boolean),
            };
          })}
          categoryOptions={[...categoryNameById.entries()].map(([id, name]) => ({ id, name }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
