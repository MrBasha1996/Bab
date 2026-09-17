import Link from "next/link";
import Image from "next/image";
import { getTranslations, getLocale } from "next-intl/server";
import { UtensilsCrossed, MessageSquareWarning, Star, Gift, MapPin, ArrowLeft, ArrowRight } from "lucide-react";
import { LanguageSwitcher } from "@/components/public-menu/LanguageSwitcher";
import type { ResolvedTable } from "@/lib/domain/resolve-table";
import type { Locale } from "@/i18n/request";

export async function EntryGateway({
  resolved,
  menuHref,
  complaintHref,
  ratingHref,
  tablet = false,
}: {
  resolved: ResolvedTable;
  menuHref: string;
  complaintHref: string;
  ratingHref: string;
  tablet?: boolean;
}) {
  const t = await getTranslations("publicMenu.gateway");
  const tCommon = await getTranslations("publicMenu");
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const name = isAr ? resolved.restaurant.nameAr : resolved.restaurant.nameEn;
  const branchName = isAr ? resolved.branch.nameAr : resolved.branch.nameEn;
  const tableLabel = isAr ? resolved.table.labelAr : resolved.table.labelEn;
  const logoUrl = resolved.restaurant.logoUrl;

  const options = [
    {
      href: menuHref,
      label: t("menu"),
      description: t("menuDesc"),
      icon: UtensilsCrossed,
      tone: "primary" as const,
    },
    {
      href: complaintHref,
      label: t("complaint"),
      description: t("complaintDesc"),
      icon: MessageSquareWarning,
      tone: "warning" as const,
    },
    {
      href: ratingHref,
      label: t("rating"),
      description: t("ratingDesc"),
      icon: Star,
      tone: "success" as const,
    },
  ];

  return (
    <div className={`mx-auto flex min-h-dvh flex-col bg-arabesque ${tablet ? "max-w-3xl" : "max-w-md"}`}>
      {/* ====== Hero header ====== */}
      <header className="panel-dark bg-arabesque-dark relative grid gap-3 overflow-hidden px-5 pb-8 pt-6 text-center sm:px-8 sm:pb-12 sm:pt-10">
        <div className="flex items-center justify-between">
          <span className="eyebrow mx-auto w-fit">{tCommon("welcome")}</span>
          <div className="absolute end-4 top-4">
            <LanguageSwitcher />
          </div>
        </div>

        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={name}
            width={88}
            height={88}
            unoptimized
            className="mx-auto size-20 rounded-full object-cover ring-4 ring-primary/30 sm:size-24"
          />
        ) : (
          <span className="mx-auto grid size-20 place-items-center rounded-full bg-primary text-primary-foreground font-display text-3xl font-bold ring-4 ring-primary/30 sm:size-24">
            {name.charAt(0)}
          </span>
        )}

        <div className="grid gap-1.5">
          <p className="text-current/80 text-xs font-semibold uppercase tracking-widest">
            {t("welcomeTitle")}
          </p>
          <h1 className="font-display text-3xl font-bold sm:text-4xl">{name}</h1>
          <p className="text-current/85 text-sm flex items-center justify-center gap-2">
            <MapPin className="size-3.5 text-primary" />
            {branchName}
          </p>
        </div>

        {/* Table chip */}
        <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full border border-current/15 bg-current/5 px-4 py-1.5 text-xs font-semibold">
          <span className="bg-primary text-primary-foreground grid size-5 place-items-center rounded-full text-[10px]">
            ✓
          </span>
          {t("tableLabel")}: <span className="text-primary">{tableLabel}</span>
        </div>

        <p className="text-current/70 mt-2 text-xs">{t("scanPrompt")}</p>
      </header>

      {/* ====== Action cards ====== */}
      <main className="flex flex-1 flex-col gap-3 px-5 py-8 sm:px-8">
        {options.map(({ href, label, description, icon: Icon, tone }) => (
          <Link
            key={href}
            href={href}
            className="lift-on-hover glass-card group flex items-center gap-4 rounded-2xl p-4 sm:p-5"
          >
            <span
              className={`grid size-14 shrink-0 place-items-center rounded-2xl transition-transform group-hover:scale-110 ${
                tone === "primary"
                  ? "bg-primary/10 text-primary"
                  : tone === "warning"
                  ? "bg-warning/10 text-warning"
                  : "bg-success/10 text-success"
              }`}
            >
              <Icon className="size-7" />
            </span>
            <div className="min-w-0 flex-1 grid gap-0.5">
              <span className="font-display text-base font-bold sm:text-lg">{label}</span>
              <span className="text-muted-foreground text-xs sm:text-sm">{description}</span>
            </div>
            <Arrow className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
          </Link>
        ))}

        {resolved.branch.googleMapsUrl ? (
          <div className="mt-4 grid gap-3">
            <span className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              {t("location")}
            </span>
            <div className="overflow-hidden rounded-2xl border shadow-sm">
              <iframe
                src={resolved.branch.googleMapsUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-video w-full border-0"
                title={t("location")}
              />
            </div>
          </div>
        ) : null}

        {/* Loyalty promo link */}
        <Link
          href={`/m/${resolved.branch.slug}/loyalty`}
          className="mt-4 lift-on-hover panel-warm group flex items-center gap-4 rounded-2xl p-4"
        >
          <span className="bg-primary/10 text-primary grid size-12 place-items-center rounded-2xl">
            <Gift className="size-6" />
          </span>
          <div className="grid gap-0.5">
            <span className="font-display text-sm font-bold">{t("loyalty")}</span>
            <span className="text-muted-foreground text-xs">{t("loyaltyDesc")}</span>
          </div>
          <Arrow className="ms-auto size-5 text-muted-foreground" />
        </Link>
      </main>
    </div>
  );
}
