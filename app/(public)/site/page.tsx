import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { MapPin, Phone } from "lucide-react";
import { getSiteData } from "@/lib/domain/get-site-data";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/request";

export default async function SiteHomePage() {
  const site = await getSiteData();
  if (!site) notFound();

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("site.home");
  const name = isAr ? site.restaurant.nameAr : site.restaurant.nameEn;
  const about = isAr ? site.restaurant.aboutAr : site.restaurant.aboutEn;

  return (
    <div className="grid gap-20 pb-20">
      <section className="relative flex min-h-[70vh] items-end overflow-hidden">
        {site.restaurant.heroImageUrl ? (
          <>
            <Image
              src={site.restaurant.heroImageUrl}
              alt=""
              fill
              priority
              className="object-cover"
            />
            <div className="from-background via-background/40 absolute inset-0 bg-gradient-to-t to-transparent" />
          </>
        ) : (
          <div className="from-brand-accent/25 via-background to-background absolute inset-0 bg-gradient-to-br" />
        )}
        <div className="relative mx-auto grid w-full max-w-6xl gap-4 px-4 pb-16 sm:px-6">
          <h1 className="font-heading text-4xl font-bold tracking-tight text-balance sm:text-6xl">{name}</h1>
          {about ? (
            <p className="text-muted-foreground max-w-xl text-base whitespace-pre-line sm:text-lg">{about}</p>
          ) : null}
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/site/reserve">{t("heroCta")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/site/events">{t("heroSecondaryCta")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-6xl gap-6 px-4 sm:px-6">
        <div className="grid gap-2">
          <span className="text-primary text-sm font-semibold tracking-wide uppercase">{t("branchesEyebrow")}</span>
          <h2 className="font-heading text-3xl font-semibold">{t("branchesTitle")}</h2>
        </div>
        {site.branches.length === 0 ? (
          <p className="text-muted-foreground text-sm">{t("noBranches")}</p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {site.branches.map((branch) => {
              const address = isAr ? branch.addressAr : branch.addressEn;
              return (
                <Card
                  key={branch.id}
                  className={`transition-shadow hover:shadow-[var(--shadow-lg)] ${branch.googleMapsUrl ? "pt-0" : ""}`}
                >
                  {branch.googleMapsUrl ? (
                    <iframe
                      src={branch.googleMapsUrl}
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      className="aspect-video w-full border-0"
                      title={isAr ? branch.nameAr : branch.nameEn}
                    />
                  ) : null}
                  <CardContent className="grid gap-3">
                    <p className="font-heading text-lg font-semibold">{isAr ? branch.nameAr : branch.nameEn}</p>
                    {address ? (
                      <p className="text-muted-foreground flex items-start gap-2 text-sm">
                        <MapPin className="mt-0.5 size-4 shrink-0" />
                        {address}
                      </p>
                    ) : null}
                    {branch.phone ? (
                      <p dir="ltr" className="text-muted-foreground flex items-center gap-2 text-sm">
                        <Phone className="size-4 shrink-0" />
                        {branch.phone}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <div className="bg-primary text-primary-foreground grid gap-4 rounded-3xl px-6 py-12 text-center sm:px-12">
          <h2 className="font-heading text-2xl font-semibold sm:text-3xl">{t("ctaTitle")}</h2>
          <p className="text-primary-foreground/90 mx-auto max-w-md text-sm sm:text-base">{t("ctaDescription")}</p>
          <div>
            <Button asChild size="lg" variant="secondary" className="mt-2">
              <Link href="/site/reserve">{t("heroCta")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
