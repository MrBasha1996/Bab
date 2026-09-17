import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { UtensilsCrossed, ArrowLeft, ArrowRight } from "lucide-react";
import { getSiteData } from "@/lib/domain/get-site-data";
import { getActiveMenuTree } from "@/lib/domain/get-menu-tree";
import { MenuBrowser } from "@/components/public-menu/MenuBrowser";
import { BranchSwitcher } from "@/components/site/BranchSwitcher";
import { Button } from "@/components/ui/button";
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
  const tHome = await getTranslations("site.home");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const { categories, allergens } = branch
    ? await getActiveMenuTree(branch.id, branch.timezone)
    : { categories: [], allergens: [] };

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-4 py-16 sm:px-6">
      <div className="grid gap-4 text-center">
        <span className="eyebrow mx-auto w-fit">{tHome("menuEyebrow")}</span>
        <div className="bg-primary/10 text-primary mx-auto flex size-14 items-center justify-center rounded-2xl">
          <UtensilsCrossed className="size-7" />
        </div>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground mx-auto max-w-xl text-base sm:text-lg leading-relaxed">
          {t("description")}
        </p>
        <Button asChild variant="link" className="h-auto mx-auto w-fit p-0 text-base font-semibold">
          <Link href="/site" className="flex items-center gap-2">
            <Arrow className="size-4" />
            {isAr ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </Button>
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
