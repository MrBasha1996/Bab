import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { CalendarClock } from "lucide-react";
import { getSiteData } from "@/lib/domain/get-site-data";
import { ReserveTableForm } from "@/components/site/ReserveTableForm";
import type { Locale } from "@/i18n/request";

export default async function SiteReservePage() {
  const site = await getSiteData();
  if (!site) notFound();

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("site.reserve");

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <div className="grid gap-4 lg:sticky lg:top-28">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <CalendarClock className="size-6" />
        </div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground max-w-sm text-base">{t("description")}</p>
        {site.branches.length > 0 ? (
          <ul className="text-muted-foreground grid gap-1 text-sm">
            {site.branches.map((branch) => (
              <li key={branch.id}>{isAr ? branch.nameAr : branch.nameEn}</li>
            ))}
          </ul>
        ) : null}
      </div>
      <ReserveTableForm
        branches={site.branches.map((b) => ({ id: b.id, label: isAr ? b.nameAr : b.nameEn }))}
      />
    </div>
  );
}
