import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { CategoryForm } from "@/components/category/CategoryForm";

export default async function NewCategoryPage({ params }: PageProps<"/menus/[id]/categories/new">) {
  await requireProfile();
  const { id } = await params;
  const t = await getTranslations("menus.category.pages");
  const supabase = await createClient();

  const { data: menu } = await supabase.from("menus").select("id, branch_id").eq("id", id).single();
  if (!menu) notFound();

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref={`/menus/${menu.id}`} title={t("newTitle")} />
      <CategoryForm menuId={menu.id} branchId={menu.branch_id} />
    </div>
  );
}
