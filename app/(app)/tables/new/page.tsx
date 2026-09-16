import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { TableForm } from "@/components/table/TableForm";

export default async function NewTablePage() {
  await requireProfile();
  const t = await getTranslations("tables.pages");
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name_ar").order("name_ar");

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/tables" title={t("newTitle")} />
      <TableForm branches={(branches ?? []).map((b) => ({ id: b.id, label: b.name_ar }))} />
    </div>
  );
}
