import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { Phone, Clock, Camera, Send, Globe, MapPin } from "lucide-react";
import { getSiteData } from "@/lib/domain/get-site-data";
import { LanguageSwitcher } from "@/components/public-menu/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Button } from "@/components/ui/button";
import type { Locale } from "@/i18n/request";

export default async function SiteLayout({ children }: LayoutProps<"/site">) {
  const site = await getSiteData();
  if (!site) notFound();

  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const tNav = await getTranslations("site.nav");
  const tTopbar = await getTranslations("site.topbar");
  const tFooter = await getTranslations("site.footer");
  const name = isAr ? site.restaurant.nameAr : site.restaurant.nameEn;
  const about = isAr ? site.restaurant.aboutAr : site.restaurant.aboutEn;
  const firstPhone = site.branches.find((b) => b.phone)?.phone ?? null;

  const links = [
    { href: "/site", label: tNav("home") },
    { href: "/site/menu", label: tNav("menu") },
    { href: "/site/events", label: tNav("events") },
    { href: "/site/contact", label: tNav("contact") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* Top contact strip — Burj-style utility bar */}
      <div className="bg-secondary/60 border-b text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-xs sm:px-6">
          <span className="flex items-center gap-2">
            <Clock className="size-3.5 text-primary" />
            {tTopbar("openHours")}
          </span>
          {firstPhone ? (
            <a
              href={`tel:${firstPhone}`}
              dir="ltr"
              className="flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary"
            >
              <Phone className="size-3.5 text-primary" />
              <span>{tTopbar("callNow")}: {firstPhone}</span>
            </a>
          ) : null}
        </div>
      </div>

      {/* Sticky main header */}
      <header className="bg-background/90 sticky top-0 z-30 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Brand (logo + name) */}
          <Link href="/site" className="flex items-center gap-3">
            {site.restaurant.logoUrl ? (
              <Image
                src={site.restaurant.logoUrl}
                alt=""
                width={48}
                height={48}
                className="size-12 rounded-full object-cover ring-2 ring-primary/20"
              />
            ) : (
              <span className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground font-display text-xl font-bold ring-2 ring-primary/20">
                {name.charAt(0)}
              </span>
            )}
            <span className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              {name}
            </span>
          </Link>

          {/* Centered nav */}
          <nav className="hidden items-center gap-1 text-sm font-medium md:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground hover:bg-secondary/60 relative rounded-md px-3 py-2 transition-colors after:absolute after:inset-x-3 after:-bottom-0.5 after:h-0.5 after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button asChild size="sm" className="hidden sm:inline-flex">
              <Link href="/site/reserve">{tNav("reserve")}</Link>
            </Button>
            <ThemeToggle />
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile nav row */}
        <div className="border-t md:hidden">
          <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 text-xs font-medium sm:px-6">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground whitespace-nowrap rounded-md px-3 py-1.5 transition-colors hover:bg-secondary/60"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/site/reserve"
              className="text-primary-foreground bg-primary whitespace-nowrap rounded-md px-3 py-1.5 font-semibold"
            >
              {tNav("reserve")}
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {/* Rich footer — Burj-style */}
      <footer className="panel-dark bg-arabesque-dark mt-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-12">
          {/* About */}
          <div className="grid gap-3 md:col-span-4">
            <Link href="/site" className="flex items-center gap-3">
              {site.restaurant.logoUrl ? (
                <Image
                  src={site.restaurant.logoUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="size-11 rounded-full object-cover ring-2 ring-primary/30"
                />
              ) : (
                <span className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground font-display text-lg font-bold">
                  {name.charAt(0)}
                </span>
              )}
              <span className="font-display text-xl font-bold">{name}</span>
            </Link>
            <p className="text-current/80 text-sm leading-relaxed">
              {about ?? tFooter("aboutBody")}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {[Camera, Send, Globe].map((Icon, idx) => (
                <a
                  key={idx}
                  href="#"
                  className="grid size-9 place-items-center rounded-full border border-current/20 text-current/85 transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  aria-label="social"
                >
                  <Icon className="size-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Branches */}
          <div className="grid gap-3 md:col-span-3">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              {tFooter("branchesTitle")}
            </span>
            <ul className="grid gap-2 text-sm">
              {site.branches.slice(0, 5).map((branch) => (
                <li key={branch.id} className="flex items-start gap-2 text-current/80">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span>{isAr ? branch.nameAr : branch.nameEn}</span>
                </li>
              ))}
              {site.branches.length === 0 ? (
                <li className="text-current/70 text-xs">—</li>
              ) : null}
            </ul>
          </div>

          {/* Quick links */}
          <nav className="grid gap-3 md:col-span-2">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              {tFooter("linksTitle")}
            </span>
            <ul className="grid gap-2 text-sm">
              {[...links, { href: "/site/reserve", label: tNav("reserve") }].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-current/80 hover:text-primary w-fit transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Contact */}
          <div className="grid gap-3 md:col-span-3">
            <span className="font-display text-sm font-bold uppercase tracking-wider text-primary">
              {tFooter("contactTitle")}
            </span>
            <ul className="grid gap-2 text-sm text-current/80">
              {firstPhone ? (
                <li>
                  <a href={`tel:${firstPhone}`} dir="ltr" className="flex items-center gap-2 transition-colors hover:text-primary">
                    <Phone className="size-4 text-primary" />
                    <span>{firstPhone}</span>
                  </a>
                </li>
              ) : null}
              <li className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <span>{tTopbar("openHours")}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-current/10">
          <div className="mx-auto max-w-6xl px-4 py-4 text-center text-xs text-current/70 sm:px-6">
            {tFooter("rights", { year: new Date().getFullYear() })}
          </div>
        </div>
      </footer>
    </div>
  );
}
