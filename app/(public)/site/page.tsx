import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import {
  MapPin,
  Phone,
  ArrowLeft,
  ArrowRight,
  Star,
  Apple,
  Play,
  UtensilsCrossed,
  CalendarDays,
  Sparkles,
} from "lucide-react";
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
  const Arrow = isAr ? ArrowLeft : ArrowRight;

  // Hardcoded stats — they can be tweaked per restaurant later
  const stats = [
    { value: "٤٧+", label: t("statsYears") },
    { value: String(site.branches.length || 11), label: t("statsBranches") },
    { value: "+120", label: t("statsItems") },
    { value: "+50k", label: t("statsGuests") },
  ];

  const menuTabs = [
    { key: "food", label: t("menuFood"), icon: UtensilsCrossed },
    { key: "daily", label: t("menuDaily"), icon: Sparkles },
    { key: "sweets", label: t("menuSweets"), icon: Star },
  ];

  const testimonials = [
    {
      name: isAr ? "إيمان يحيى" : "Eman Yahya",
      quote: isAr
        ? "أجواء هادئة وجميلة، الأكل مررررا لذيييييذ. تجربة لا تُنسى!"
        : "A wonderful experience, the food is amazing and the service is amazing.",
      role: isAr ? "ضيفة دائمة" : "Returning guest",
    },
    {
      name: isAr ? "محمود ضافر" : "Mahmoud Dafer",
      quote: isAr
        ? "من أفضل المطاعم التي زرتها، الفتة كباب خيالية! أنصح به بشدة."
        : "One of the best grills I have ever tasted in my life. I strongly recommend it.",
      role: isAr ? "زائر جديد" : "First-time visitor",
    },
    {
      name: isAr ? "رودا المشاري" : "Rawda El-Mishari",
      quote: isAr
        ? "أفضل مطعم لبناني، تجربة مرضية جدًا! بالتأكيد أنصح به."
        : "Amazing! Best Lebanese restaurant, extremely satisfying! Definitely recommend.",
      role: isAr ? "ضيفة دائمة" : "Returning guest",
    },
  ];

  return (
    <div className="grid gap-0 pb-0">
      {/* ============= HERO ============= */}
      <section className="relative flex min-h-[88vh] items-center overflow-hidden">
        {site.restaurant.heroImageUrl ? (
          <>
            <Image
              src={site.restaurant.heroImageUrl}
              alt=""
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />
            <div className="hero-overlay absolute inset-0" />
          </>
        ) : (
          <div className="bg-arabesque absolute inset-0 bg-gradient-to-br from-brand-accent/20 via-background to-background" />
        )}

        <div className="relative mx-auto grid w-full max-w-6xl gap-6 px-4 py-24 sm:px-6">
          <span className="eyebrow w-fit">{t("heroEyebrow")}</span>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight text-balance sm:text-7xl lg:text-8xl">
            {name}
          </h1>
          {about ? (
            <p className="text-muted-foreground max-w-2xl text-base whitespace-pre-line text-base sm:text-lg lg:text-xl">
              {about}
            </p>
          ) : null}
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <Button asChild size="lg" className="h-12 px-7 text-base">
              <Link href="/site/reserve">
                {t("heroCta")}
                <Arrow className="size-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 px-7 text-base"
            >
              <Link href="/site/events">{t("heroSecondaryCta")}</Link>
            </Button>
          </div>
        </div>

        {/* Stat strip at the bottom of the hero */}
        <div className="absolute inset-x-0 bottom-0 border-t border-foreground/10 bg-background/80 backdrop-blur-sm">
          <div className="mx-auto grid max-w-6xl grid-cols-2 gap-px px-4 sm:px-6 md:grid-cols-4">
            {stats.map((stat, idx) => (
              <div
                key={idx}
                className="grid gap-1 border-foreground/10 px-2 py-5 text-center md:border-s first:md:border-s-0"
              >
                <span className="stat-numeral !text-3xl sm:!text-5xl">{stat.value}</span>
                <span className="text-muted-foreground text-xs font-medium uppercase tracking-wider sm:text-sm">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============= STORY / ABOUT ============= */}
      <section className="relative overflow-hidden py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="grid gap-5">
            <span className="eyebrow w-fit">{t("storyEyebrow")}</span>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {t("storyTitle")}
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed sm:text-lg">
              {t("storyBody")}
            </p>
            <div>
              <Button asChild variant="link" className="h-auto p-0 text-base font-semibold">
                <Link href="/site/menu" className="flex items-center gap-2">
                  {t("storyCta")}
                  <Arrow className="size-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Decorative image collage */}
          <div className="relative grid aspect-square grid-cols-2 gap-4 sm:aspect-[4/5]">
            <div className="panel-warm bg-arabesque relative overflow-hidden rounded-3xl">
              <div className="absolute inset-0 grid place-items-center">
                <UtensilsCrossed className="size-16 text-primary/30" />
              </div>
              <span className="absolute bottom-4 start-4 text-xs font-semibold uppercase tracking-wider text-primary">
                {t("menuFood")}
              </span>
            </div>
            <div className="panel-warm relative mt-12 overflow-hidden rounded-3xl">
              <Image
                src={site.restaurant.heroImageUrl ?? "/next.svg"}
                alt=""
                fill
                className="object-cover"
                sizes="(min-width: 640px) 30vw, 50vw"
              />
              <span className="absolute bottom-4 start-4 text-xs font-semibold uppercase tracking-wider text-background bg-foreground/60 backdrop-blur px-2 py-1 rounded">
                {t("menuDaily")}
              </span>
            </div>
            <div className="panel-warm bg-arabesque relative overflow-hidden rounded-3xl -mt-8 col-span-2 sm:col-span-1">
              <div className="absolute inset-0 grid place-items-center">
                <Star className="size-14 text-primary/30" />
              </div>
              <span className="absolute bottom-4 start-4 text-xs font-semibold uppercase tracking-wider text-primary">
                {t("menuSweets")}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ============= BRANCHES ============= */}
      <section className="bg-secondary/30 py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 sm:px-6">
          <div className="grid gap-3 text-center">
            <span className="eyebrow mx-auto w-fit">{t("branchesEyebrow")}</span>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {t("branchesTitle")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-xl text-base sm:text-lg">
              {t("branchesSubtitle")}
            </p>
          </div>

          {site.branches.length === 0 ? (
            <p className="text-muted-foreground text-center text-sm">{t("noBranches")}</p>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {site.branches.map((branch) => {
                const address = isAr ? branch.addressAr : branch.addressEn;
                return (
                  <Card
                    key={branch.id}
                    className={`lift-on-hover overflow-hidden ${branch.googleMapsUrl ? "pt-0" : ""}`}
                  >
                    {branch.googleMapsUrl ? (
                      <iframe
                        src={branch.googleMapsUrl}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                        className="aspect-video w-full border-0"
                        title={isAr ? branch.nameAr : branch.nameEn}
                      />
                    ) : (
                      <div className="bg-arabesque aspect-video w-full" />
                    )}
                    <CardContent className="grid gap-3 p-5">
                      <p className="font-display text-lg font-bold">
                        {isAr ? branch.nameAr : branch.nameEn}
                      </p>
                      {address ? (
                        <p className="text-muted-foreground flex items-start gap-2 text-sm leading-relaxed">
                          <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                          {address}
                        </p>
                      ) : null}
                      {branch.phone ? (
                        <a
                          href={`tel:${branch.phone}`}
                          dir="ltr"
                          className="text-muted-foreground flex items-center gap-2 text-sm transition-colors hover:text-primary"
                        >
                          <Phone className="size-4 shrink-0 text-primary" />
                          {branch.phone}
                        </a>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============= APP PROMOTION ============= */}
      <section className="panel-dark bg-arabesque-dark relative overflow-hidden py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="grid gap-5 text-center lg:text-start">
            <span className="eyebrow mx-auto w-fit lg:mx-0">{t("appEyebrow")}</span>
            <h2 className="font-display text-4xl font-bold leading-tight text-balance sm:text-5xl">
              {t("appTitle")}
            </h2>
            <p className="text-current/70 mx-auto max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0">
              {t("appBody")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <a
                href="#"
                className="bg-current/5 hover:border-primary inline-flex items-center gap-3 rounded-2xl border border-current/15 px-5 py-3 text-start transition-colors hover:bg-current/10"
              >
                <Apple className="size-7 text-primary" />
                <span className="grid">
                  <span className="text-[10px] uppercase tracking-wider text-current/60">
                    Download on the
                  </span>
                  <span className="font-display text-base font-bold">{t("appStore")}</span>
                </span>
              </a>
              <a
                href="#"
                className="bg-current/5 hover:border-primary inline-flex items-center gap-3 rounded-2xl border border-current/15 px-5 py-3 text-start transition-colors hover:bg-current/10"
              >
                <Play className="size-7 text-primary" />
                <span className="grid">
                  <span className="text-[10px] uppercase tracking-wider text-current/60">
                    Get it on
                  </span>
                  <span className="font-display text-base font-bold">{t("googlePlay")}</span>
                </span>
              </a>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="relative mx-auto w-full max-w-sm">
            <div className="relative aspect-[9/19] overflow-hidden rounded-[2.5rem] border-4 border-current/15 bg-background shadow-2xl">
              <div className="bg-arabesque absolute inset-0" />
              <div className="relative grid h-full place-items-center p-8 text-center">
                <div className="grid gap-3">
                  <div className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-primary-foreground font-display text-3xl font-bold">
                    {name.charAt(0)}
                  </div>
                  <span className="font-display text-2xl font-bold">{name}</span>
                  <span className="text-muted-foreground text-sm">
                    {t("appEyebrow")}
                  </span>
                  <div className="bg-primary text-primary-foreground mt-3 rounded-full px-5 py-2 text-sm font-semibold">
                    {t("heroCta")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============= MENU PREVIEW ============= */}
      <section className="py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6">
          <div className="grid gap-3 text-center">
            <span className="eyebrow mx-auto w-fit">{t("menuEyebrow")}</span>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {t("menuTitle")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-xl text-base sm:text-lg">
              {t("menuSubtitle")}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {menuTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.key}
                  href="/site/menu"
                  className="lift-on-hover panel-warm group grid gap-4 rounded-3xl p-8 text-center"
                >
                  <div className="bg-primary/10 text-primary mx-auto grid size-16 place-items-center rounded-2xl transition-transform group-hover:scale-110">
                    <Icon className="size-7" />
                  </div>
                  <span className="font-display text-xl font-bold">{tab.label}</span>
                  <span className="text-muted-foreground flex items-center justify-center gap-1 text-sm font-semibold">
                    {t("menuViewAll")}
                    <Arrow className="size-3.5 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="text-center">
            <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base">
              <Link href="/site/menu" className="flex items-center gap-2">
                {t("menuViewAll")}
                <Arrow className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ============= EVENTS ============= */}
      <section className="bg-secondary/30 py-24">
        <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
          <div className="panel-warm bg-arabesque relative grid aspect-[5/4] place-items-center overflow-hidden rounded-3xl">
            <CalendarDays className="size-24 text-primary/30" />
            <span className="absolute bottom-6 start-6 text-xs font-semibold uppercase tracking-wider text-primary">
              {t("eventsEyebrow")}
            </span>
          </div>
          <div className="grid gap-5 text-center lg:text-start">
            <span className="eyebrow mx-auto w-fit lg:mx-0">{t("eventsEyebrow")}</span>
            <h2 className="font-display text-4xl font-bold leading-tight text-balance sm:text-5xl">
              {t("eventsTitle")}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-xl text-base leading-relaxed sm:text-lg lg:mx-0">
              {t("eventsBody")}
            </p>
            <div>
              <Button asChild size="lg" className="h-12 px-7 text-base">
                <Link href="/site/events" className="flex items-center gap-2">
                  {t("eventsCta")}
                  <Arrow className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ============= TESTIMONIALS ============= */}
      <section className="py-24">
        <div className="mx-auto grid w-full max-w-6xl gap-12 px-4 sm:px-6">
          <div className="grid gap-3 text-center">
            <span className="eyebrow mx-auto w-fit">{t("testimonialsEyebrow")}</span>
            <h2 className="font-display text-4xl font-bold tracking-tight text-balance sm:text-5xl">
              {t("testimonialsTitle")}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="lift-on-hover gap-0 p-0">
                <CardContent className="grid gap-4 p-6">
                  <div className="flex items-center gap-1 text-primary">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="size-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-foreground text-base leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div className="mt-auto grid gap-0.5 border-t pt-4">
                    <span className="font-display text-base font-bold">{testimonial.name}</span>
                    <span className="text-muted-foreground text-xs">{testimonial.role}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ============= FINAL CTA ============= */}
      <section className="px-4 pb-24 sm:px-6">
        <div className="panel-dark bg-arabesque-dark relative mx-auto grid max-w-6xl gap-6 overflow-hidden rounded-[2rem] px-6 py-16 text-center sm:px-12 sm:py-20">
          <div className="divider-arabesque mx-auto max-w-xs" />
          <h2 className="font-display text-3xl font-bold text-balance sm:text-5xl">
            {t("ctaTitle")}
          </h2>
          <p className="text-current/70 mx-auto max-w-md text-base sm:text-lg">
            {t("ctaDescription")}
          </p>
          <div className="mt-2 flex justify-center">
            <Button asChild size="lg" className="h-12 px-8 text-base">
              <Link href="/site/reserve" className="flex items-center gap-2">
                {t("heroCta")}
                <Arrow className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
