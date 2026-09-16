import { getTranslations, getLocale } from "next-intl/server";
import { LanguageSwitcher } from "@/components/public-menu/LanguageSwitcher";
import type { ResolvedTable } from "@/lib/domain/resolve-table";
import type { Locale } from "@/i18n/request";

export async function MenuHeader({ resolved, tablet = false }: { resolved: ResolvedTable; tablet?: boolean }) {
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("publicMenu");

  return (
    <header className={`flex items-center justify-between gap-3 border-b ${tablet ? "px-6 py-4" : "px-4 py-3"}`}>
      <div className="grid gap-0.5">
        <span className={tablet ? "text-base text-muted-foreground" : "text-sm text-muted-foreground"}>
          {t("welcome")}
        </span>
        <h1 className={tablet ? "text-2xl font-semibold" : "text-lg font-semibold"}>
          {isAr ? resolved.restaurant.nameAr : resolved.restaurant.nameEn}
        </h1>
        <span className={tablet ? "text-sm text-muted-foreground" : "text-xs text-muted-foreground"}>
          {isAr ? resolved.branch.nameAr : resolved.branch.nameEn} ·{" "}
          {t("table", { label: isAr ? resolved.table.labelAr : resolved.table.labelEn })}
        </span>
      </div>
      <LanguageSwitcher />
    </header>
  );
}
