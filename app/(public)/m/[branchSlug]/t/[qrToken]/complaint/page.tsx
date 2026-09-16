import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { resolveTable } from "@/lib/domain/resolve-table";
import { MenuHeader } from "@/components/public-menu/MenuHeader";
import { ComplaintForm } from "@/components/public-menu/ComplaintForm";

export default async function ComplaintPage({
  params,
}: PageProps<"/m/[branchSlug]/t/[qrToken]/complaint">) {
  const { branchSlug, qrToken } = await params;
  const resolved = await resolveTable(branchSlug, qrToken);
  if (!resolved) notFound();

  const t = await getTranslations("publicMenu.complaint");

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col">
      <MenuHeader resolved={resolved} />
      <main className="flex-1 px-4 py-6">
        <h1 className="mb-4 text-lg font-semibold">{t("title")}</h1>
        <ComplaintForm branchId={resolved.branch.id} tableId={resolved.table.id} />
      </main>
    </div>
  );
}
