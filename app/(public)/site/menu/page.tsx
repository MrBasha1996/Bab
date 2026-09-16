import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { getSiteData } from "@/lib/domain/get-site-data";
import { getActiveMenuTree } from "@/lib/domain/get-menu-tree";
import { MenuBrowser } from "@/components/public-menu/MenuBrowser";
import { BranchSwitcher } from "@/components/site/BranchSwitcher";
import type { Locale } from "@/i18n/request";

export default async function SiteMenuPage({
  searchParams,
}: PageProps<"/site/menu">) {
  const site = await getSiteData();
  if (!site) notFound();

  const { branch: branchParam } = await searchParams;
  const branch =
    site.branches.find((b) => b.id === branchParam) ?? site.branches[0] ?? null;

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("site.menu");

  const { categories, allergens } = branch
    ? await getActiveMenuTree(branch.id, branch.timezone)
    : { categories: [], allergens: [] };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-10 sm:px-6">
      <div className="grid gap-2">
        <h1 className="font-heading text-3xl font-semibold">{t("title")}</h1>
        <p className="text-muted-foreground text-sm">{t("description")}</p>
      </div>

      {site.branches.length > 1 && (
        <BranchSwitcher
          branches={site.branches.map((b) => ({
            id: b.id,
            label: isAr ? b.nameAr : b.nameEn,
          }))}
          value={branch?.id ?? ""}
          label={t("selectBranch")}
        />
      )}

      {branch ? (
        <MenuBrowser
          categories={categories}
          allergens={allergens}
          branchId={branch.id}
          tableId={null}
          source="site"
        />
      ) : null}
    </div>
  );
}
