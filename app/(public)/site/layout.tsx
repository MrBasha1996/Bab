import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
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
  const t = await getTranslations("site.nav");
  const name = isAr ? site.restaurant.nameAr : site.restaurant.nameEn;

  const links = [
    { href: "/site", label: t("home") },
    { href: "/site/menu", label: t("menu") },
    { href: "/site/events", label: t("events") },
    { href: "/site/contact", label: t("contact") },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-background/90 sticky top-0 z-20 border-b backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/site" className="flex items-center gap-2">
            {site.restaurant.logoUrl ? (
              <Image
                src={site.restaurant.logoUrl}
                alt=""
                width={36}
                height={36}
                className="h-9 w-9 rounded-full object-cover"
              />
            ) : null}
            <span className="font-heading text-xl font-semibold tracking-tight">{name}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-6 text-sm font-medium">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground relative py-1 transition-colors after:absolute after:inset-x-0 after:-bottom-1 after:h-0.5 after:scale-x-0 after:bg-primary after:transition-transform hover:after:scale-x-100"
              >
                {link.label}
              </Link>
            ))}
            <Button asChild size="sm">
              <Link href="/site/reserve">{t("reserve")}</Link>
            </Button>
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <LanguageSwitcher />
            </div>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-secondary/60 mt-16 border-t">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div className="grid gap-2">
            <span className="font-heading text-lg font-semibold">{name}</span>
            {site.restaurant.aboutAr || site.restaurant.aboutEn ? (
              <p className="text-muted-foreground line-clamp-3 text-sm">
                {isAr ? site.restaurant.aboutAr : site.restaurant.aboutEn}
              </p>
            ) : null}
          </div>
          <div className="grid gap-2 text-sm">
            <span className="font-medium">{t("branches")}</span>
            {site.branches.map((branch) => (
              <span key={branch.id} className="text-muted-foreground">
                {isAr ? branch.nameAr : branch.nameEn}
              </span>
            ))}
          </div>
          <nav className="grid gap-2 text-sm">
            {[...links, { href: "/site/reserve", label: t("reserve") }].map((link) => (
              <Link key={link.href} href={link.href} className="text-muted-foreground hover:text-foreground w-fit">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="text-muted-foreground border-t px-4 py-4 text-center text-xs sm:px-6">
          © {new Date().getFullYear()} {name}
        </div>
      </footer>
    </div>
  );
}
