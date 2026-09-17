import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { PartyPopper, ArrowLeft, ArrowRight, ShieldCheck, Sparkles, Users } from "lucide-react";
import { getSiteData } from "@/lib/domain/get-site-data";
import { EventRequestForm } from "@/components/site/EventRequestForm";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/request";

export default async function SiteEventsPage() {
  const site = await getSiteData();
  if (!site) notFound();

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("site.events");
  const tHome = await getTranslations("site.home");
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  const trustBadges = [
    { icon: ShieldCheck, label: isAr ? "ردّ خلال ٢٤ ساعة" : "Reply within 24 hours" },
    { icon: Sparkles, label: isAr ? "باقات حسب الطلب" : "Custom-tailored packages" },
    { icon: Users, label: isAr ? "حتى ٥٠٠ ضيف" : "Up to 500 guests" },
  ];

  return (
    <div className="bg-arabesque relative">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.5fr] lg:items-start lg:gap-12">
        {/* Left column: heading + reassurance */}
        <aside className="grid gap-6 lg:sticky lg:top-28">
          <span className="eyebrow w-fit">{tHome("eventsEyebrow")}</span>
          <div className="bg-primary/10 text-primary flex size-16 items-center justify-center rounded-2xl">
            <PartyPopper className="size-8" />
          </div>
          <h1 className="font-display text-4xl font-bold sm:text-5xl">{t("title")}</h1>
          <p className="text-muted-foreground max-w-md text-base sm:text-lg leading-relaxed">
            {t("description")}
          </p>

          {/* Trust badges */}
          <ul className="grid gap-3">
            {trustBadges.map((badge, idx) => {
              const Icon = badge.icon;
              return (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <span className="bg-success/10 text-success grid size-8 place-items-center rounded-full">
                    <Icon className="size-4" />
                  </span>
                  <span className="font-medium">{badge.label}</span>
                </li>
              );
            })}
          </ul>

          {site.branches.length > 0 ? (
            <div className="panel-warm rounded-2xl p-4">
              <p className="text-muted-foreground text-xs font-semibold uppercase tracking-wider mb-2">
                {isAr ? "الفروع المتاحة للمناسبات" : "Branches available for events"}
              </p>
              <ul className="grid gap-1.5 text-sm">
                {site.branches.map((branch) => (
                  <li key={branch.id} className="flex items-center justify-between">
                    <span>{isAr ? branch.nameAr : branch.nameEn}</span>
                    {branch.phone ? (
                      <a
                        href={`tel:${branch.phone}`}
                        dir="ltr"
                        className="text-primary font-mono text-xs hover:underline"
                      >
                        {branch.phone}
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button asChild variant="link" className="h-auto w-fit p-0 text-base font-semibold">
            <Link href="/site" className="flex items-center gap-2">
              <Arrow className="size-4" />
              {isAr ? "العودة للرئيسية" : "Back to home"}
            </Link>
          </Button>
        </aside>

        {/* Right column: the wizard */}
        <div className="min-w-0">
          <EventRequestForm
            branches={site.branches.map((b) => ({ id: b.id, label: isAr ? b.nameAr : b.nameEn }))}
          />
        </div>
      </div>
    </div>
  );
}
