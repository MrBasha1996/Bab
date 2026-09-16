import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryForm } from "@/components/category/CategoryForm";
import { CategoryItemsPanel } from "@/components/category/CategoryItemsPanel";

export default async function CategoryDetailPage({
  params,
}: PageProps<"/menus/[id]/categories/[categoryId]">) {
  await requireProfile();
  const { id: menuId, categoryId } = await params;
  const t = await getTranslations("menus.category.pages");
  const supabase = await createClient();

  const { data: category } = await supabase
    .from("menu_categories")
    .select("id, menu_id, branch_id, name_ar, name_en, sort_order")
    .eq("id", categoryId)
    .single();

  if (!category || category.menu_id !== menuId) notFound();

  const [{ data: links }, { data: branchItems }] = await Promise.all([
    supabase.from("menu_category_items").select("item_id").eq("category_id", categoryId),
    supabase
      .from("menu_items")
      .select("id, name_ar, image_url")
      .eq("branch_id", category.branch_id)
      .is("deleted_at", null)
      .order("name_ar"),
  ]);

  // استعلامان منفصلان بدل embed join — النوع اليدوي لـ Database لا يحمل
  // Relationships الكاملة اللازمة لأنواع embed (نفس درس المرحلة 1).
  const linkedItemIds = new Set((links ?? []).map((l) => l.item_id));
  const itemById = new Map((branchItems ?? []).map((item) => [item.id, item]));
  const linkedItems = [...linkedItemIds]
    .map((itemId) => {
      const item = itemById.get(itemId);
      return item ? { id: item.id, label: item.name_ar, imageUrl: item.image_url } : null;
    })
    .filter((item): item is { id: string; label: string; imageUrl: string | null } => item !== null);
  const availableItems = (branchItems ?? [])
    .filter((item) => !linkedItemIds.has(item.id))
    .map((item) => ({ id: item.id, label: item.name_ar, imageUrl: item.image_url }));

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref={`/menus/${menuId}`} title={category.name_ar} />
      <div className="grid gap-6 md:grid-cols-2">
        <CategoryForm
          categoryId={category.id}
          menuId={menuId}
          branchId={category.branch_id}
          defaultValues={{
            menuId: category.menu_id,
            branchId: category.branch_id,
            nameAr: category.name_ar,
            nameEn: category.name_en,
            sortOrder: category.sort_order,
          }}
        />
        <div className="grid gap-2">
          <h2 className="text-lg font-semibold">{t("itemsTitle")}</h2>
          <CategoryItemsPanel
            categoryId={category.id}
            menuId={menuId}
            branchId={category.branch_id}
            linkedItems={linkedItems}
            availableItems={availableItems}
          />
        </div>
      </div>
    </div>
  );
}
