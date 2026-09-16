import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ChevronRight, UtensilsCrossed } from "lucide-react";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MenuForm } from "@/components/menu/MenuForm";
import { MenuScheduleManager } from "@/components/menu/MenuScheduleManager";

export default async function MenuDetailPage({ params }: PageProps<"/menus/[id]">) {
  await requireProfile();
  const { id } = await params;
  const t = await getTranslations("menus.pages");
  const supabase = await createClient();

  const { data: menu } = await supabase
    .from("menus")
    .select("id, branch_id, name_ar, name_en")
    .eq("id", id)
    .single();

  if (!menu) notFound();

  const [{ data: schedules }, { data: categories }] = await Promise.all([
    supabase
      .from("menu_schedules")
      .select("id, day_of_week, start_time, end_time")
      .eq("menu_id", id)
      .order("day_of_week"),
    supabase
      .from("menu_categories")
      .select("id, name_ar")
      .eq("menu_id", id)
      .is("deleted_at", null)
      .order("sort_order"),
  ]);

  const categoryIds = (categories ?? []).map((c) => c.id);
  const { data: categoryItems } =
    categoryIds.length > 0
      ? await supabase.from("menu_category_items").select("category_id").in("category_id", categoryIds)
      : { data: [] };
  const itemCountByCategoryId = new Map<string, number>();
  for (const ci of categoryItems ?? []) {
    itemCountByCategoryId.set(ci.category_id, (itemCountByCategoryId.get(ci.category_id) ?? 0) + 1);
  }

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/menus" title={menu.name_ar} />

      <div className="grid gap-6 md:grid-cols-2">
        <MenuForm menuId={menu.id} defaultValues={{ branchId: menu.branch_id, nameAr: menu.name_ar, nameEn: menu.name_en }} />

        <div className="grid gap-2">
          <h2 className="text-lg font-semibold">{t("scheduleTitle")}</h2>
          <MenuScheduleManager
            menuId={menu.id}
            branchId={menu.branch_id}
            schedules={(schedules ?? []).map((s) => ({
              id: s.id,
              dayOfWeek: s.day_of_week,
              startTime: s.start_time,
              endTime: s.end_time,
            }))}
          />
        </div>
      </div>

      <div className="grid gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("categoriesTitle")}</h2>
          <Button asChild size="sm">
            <Link href={`/menus/${menu.id}/categories/new`}>{t("addCategory")}</Link>
          </Button>
        </div>
        {categories && categories.length > 0 ? (
          <div className="grid gap-2">
            {categories.map((cat) => (
              <Link key={cat.id} href={`/menus/${menu.id}/categories/${cat.id}`}>
                <Card className="transition-shadow hover:shadow-[var(--shadow-lg)]">
                  <CardContent className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <UtensilsCrossed className="size-4 text-muted-foreground" />
                    </div>
                    <span className="flex-1 font-medium">{cat.name_ar}</span>
                    <Badge variant="outline">{itemCountByCategoryId.get(cat.id) ?? 0}</Badge>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm">{t("noCategoriesYet")}</p>
        )}
      </div>
    </div>
  );
}
