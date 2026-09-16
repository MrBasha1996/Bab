import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getActiveMenuTree, type PublicCategory } from "@/lib/domain/get-menu-tree";
import { PageHeader } from "@/components/ui/page-header";
import { ReservationForm } from "@/components/reservation/ReservationForm";

export default async function NewReservationPage() {
  await requireProfile();
  const t = await getTranslations("reservations.pages");
  const supabase = await createClient();
  const [{ data: branches }, { data: tables }] = await Promise.all([
    supabase.from("branches").select("id, name_ar, timezone").order("name_ar"),
    supabase.from("tables").select("id, branch_id, label_ar").is("deleted_at", null),
  ]);

  const menuByBranch: Record<string, PublicCategory[]> = {};
  await Promise.all(
    (branches ?? []).map(async (b) => {
      const { categories } = await getActiveMenuTree(b.id, b.timezone);
      menuByBranch[b.id] = categories;
    })
  );

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/reservations" title={t("newTitle")} />
      <ReservationForm
        branches={(branches ?? []).map((b) => ({ id: b.id, label: b.name_ar }))}
        tables={(tables ?? []).map((table) => ({
          id: table.id,
          branchId: table.branch_id,
          label: table.label_ar,
        }))}
        menuByBranch={menuByBranch}
      />
    </div>
  );
}
