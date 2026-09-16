import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { MenusListTable } from "@/components/menu/MenusListTable";

export default async function MenusPage() {
  await requireProfile();
  const t = await getTranslations("menus.pages");
  const supabase = await createClient();
  const [{ data: menus }, { data: branches }, { data: categories }] = await Promise.all([
    supabase.from("menus").select("id, branch_id, name_ar, created_at").is("deleted_at", null).order("name_ar"),
    supabase.from("branches").select("id, name_ar"),
    supabase.from("menu_categories").select("id, menu_id").is("deleted_at", null),
  ]);
  const branchNameById = new Map((branches ?? []).map((b) => [b.id, b.name_ar]));
  const categoryCountByMenuId = new Map<string, number>();
  for (const c of categories ?? []) {
    categoryCountByMenuId.set(c.menu_id, (categoryCountByMenuId.get(c.menu_id) ?? 0) + 1);
  }

  return (
    <div className="grid gap-6 p-6">
      <PageHeader
        title={t("listTitle")}
        description={t("listDescription")}
        actions={
          <Button asChild>
            <Link href="/menus/new">{t("addMenu")}</Link>
          </Button>
        }
      />
      {menus && menus.length > 0 ? (
        <MenusListTable
          rows={menus.map((menu) => ({
            id: menu.id,
            branchId: menu.branch_id,
            branchName: branchNameById.get(menu.branch_id) ?? "",
            nameAr: menu.name_ar,
            categoriesCount: categoryCountByMenuId.get(menu.id) ?? 0,
            createdAt: menu.created_at,
          }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
