import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { BranchesListTable } from "@/components/branch/BranchesListTable";

export default async function BranchesPage() {
  await requireProfile();
  const t = await getTranslations("branches.pages");
  const supabase = await createClient();
  const { data: branches } = await supabase
    .from("branches")
    .select("id, name_ar, name_en, address_ar, timezone, created_at")
    .is("deleted_at", null)
    .order("name_ar");

  return (
    <div className="grid gap-6 p-6">
      <PageHeader
        title={t("listTitle")}
        description={t("listDescription")}
        actions={
          <Button asChild>
            <Link href="/branches/new">{t("addBranch")}</Link>
          </Button>
        }
      />
      {branches && branches.length > 0 ? (
        <BranchesListTable
          rows={branches.map((b) => ({
            id: b.id,
            nameAr: b.name_ar,
            nameEn: b.name_en,
            addressAr: b.address_ar,
            timezone: b.timezone,
            createdAt: b.created_at,
          }))}
        />
      ) : (
        <p className="text-muted-foreground text-sm">{t("empty")}</p>
      )}
    </div>
  );
}
