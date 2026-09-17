import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { CalendarClock, ArrowLeft, ArrowRight } from "lucide-react";
import { getSiteData } from "@/lib/domain/get-site-data";
import { ReserveTableForm } from "@/components/site/ReserveTableForm";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/request";

export default async function SiteReservePage() {
  const site = await getSiteData();
  if (!site) notFound();

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("site.reserve");
  const tNav = await getTranslations("site.nav");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <div className="grid gap-5 lg:sticky lg:top-28">
        <span className="eyebrow w-fit">{tNav("reserve")}</span>
        <div className="bg-primary/10 text-primary flex size-14 items-center justify-center rounded-2xl">
          <CalendarClock className="size-7" />
        </div>
        <h1 className="font-display text-4xl font-bold sm:text-5xl">{t("title")}</h1>
        <p className="text-muted-foreground max-w-md text-base sm:text-lg leading-relaxed">{t("description")}</p>
        {site.branches.length > 0 ? (
          <ul className="text-muted-foreground grid gap-1.5 text-sm">
            {site.branches.map((branch) => (
              <li key={branch.id}>{isAr ? branch.nameAr : branch.nameEn}</li>
            ))}
          </ul>
        ) : null}
        <Button asChild variant="link" className="h-auto w-fit p-0 text-base font-semibold">
          <Link href="/site" className="flex items-center gap-2">
            <Arrow className="size-4" />
            {isAr ? "العودة للرئيسية" : "Back to home"}
          </Link>
        </Button>
      </div>
      <ReserveTableForm
        branches={site.branches.map((b) => ({ id: b.id, label: isAr ? b.nameAr : b.nameEn }))}
      />
    </div>
  );
}
