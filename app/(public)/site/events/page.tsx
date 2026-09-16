import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { PartyPopper } from "lucide-react";
import { getSiteData } from "@/lib/domain/get-site-data";
import { EventRequestForm } from "@/components/site/EventRequestForm";
import type { Locale } from "@/i18n/request";

export default async function SiteEventsPage() {
  const site = await getSiteData();
  if (!site) notFound();

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("site.events");

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.2fr] lg:items-start">
      <div className="grid gap-4 lg:sticky lg:top-28">
        <div className="bg-primary/10 text-primary flex size-12 items-center justify-center rounded-full">
          <PartyPopper className="size-6" />
        </div>
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{t("title")}</h1>
        <p className="text-muted-foreground max-w-sm text-base">{t("description")}</p>
      </div>
      <EventRequestForm
        branches={site.branches.map((b) => ({ id: b.id, label: isAr ? b.nameAr : b.nameEn }))}
      />
    </div>
  );
}
