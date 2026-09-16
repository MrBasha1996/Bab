import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { BranchForm } from "@/components/branch/BranchForm";

export default async function NewBranchPage() {
  await requireProfile();
  const t = await getTranslations("branches.pages");

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/branches" title={t("newTitle")} />
      <BranchForm />
    </div>
  );
}
