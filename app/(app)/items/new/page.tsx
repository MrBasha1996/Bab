import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { ItemForm } from "@/components/item/ItemForm";

export default async function NewItemPage() {
  await requireProfile();
  const t = await getTranslations("menus.item.pages");
  const supabase = await createClient();

  const [{ data: branches }, { data: categories }, { data: allergens }] = await Promise.all([
    supabase.from("branches").select("id, name_ar").order("name_ar"),
    supabase.from("menu_categories").select("id, branch_id, name_ar").is("deleted_at", null).order("name_ar"),
    supabase.from("allergens").select("id, name_ar").order("name_ar"),
  ]);

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/items" title={t("newTitle")} />
      <ItemForm
        branches={(branches ?? []).map((b) => ({ id: b.id, label: b.name_ar }))}
        categories={(categories ?? []).map((c) => ({ id: c.id, branchId: c.branch_id, label: c.name_ar }))}
        allergens={(allergens ?? []).map((a) => ({ id: a.id, label: a.name_ar }))}
      />
    </div>
  );
}
