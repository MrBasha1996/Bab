import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { MapPin, UtensilsCrossed } from "lucide-react";
import { LanguageSwitcher } from "@/components/public-menu/LanguageSwitcher";
import type { ResolvedTable } from "@/lib/domain/resolve-table";
import type { Locale } from "@/i18n/request";

export async function MenuHeader({ resolved, tablet = false }: { resolved: ResolvedTable; tablet?: boolean }) {
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("publicMenu");
  const name = isAr ? resolved.restaurant.nameAr : resolved.restaurant.nameEn;
  const branchName = isAr ? resolved.branch.nameAr : resolved.branch.nameEn;
  const tableLabel = isAr ? resolved.table.labelAr : resolved.table.labelEn;
  const logoUrl = resolved.restaurant.logoUrl;

  return (
    <header className={`panel-dark bg-arabesque-dark relative overflow-hidden border-b border-current/10 ${tablet ? "px-6 py-5" : "px-4 py-4"}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={name}
              width={tablet ? 56 : 44}
              height={tablet ? 56 : 44}
              unoptimized
              className={`shrink-0 rounded-full object-cover ring-2 ring-primary/30 ${tablet ? "size-14" : "size-11"}`}
            />
          ) : (
            <span className={`grid shrink-0 place-items-center rounded-full bg-primary text-primary-foreground font-display font-bold ring-2 ring-primary/30 ${tablet ? "size-14 text-xl" : "size-11 text-base"}`}>
              {name.charAt(0)}
            </span>
          )}
          <div className="min-w-0 grid gap-0.5">
            <h1 className={`font-display font-bold leading-tight ${tablet ? "text-2xl" : "text-lg"}`}>
              {name}
            </h1>
            <span className={`flex items-center gap-1.5 text-current/70 ${tablet ? "text-sm" : "text-xs"}`}>
              <MapPin className="size-3.5 text-primary" />
              {branchName}
              <span className="text-current/30">•</span>
              <UtensilsCrossed className="size-3 text-primary" />
              {t("table", { label: tableLabel })}
            </span>
          </div>
        </div>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
