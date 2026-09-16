"use client";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE, type Locale } from "@/i18n/locales";

export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const t = useTranslations("publicMenu.language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: Locale) {
    if (next === locale) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex gap-1">
      <Button
        type="button"
        size="sm"
        variant={locale === "ar" ? "default" : "outline"}
        disabled={isPending}
        onClick={() => switchTo("ar")}
      >
        {t("ar")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "default" : "outline"}
        disabled={isPending}
        onClick={() => switchTo("en")}
      >
        {t("en")}
      </Button>
    </div>
  );
}
