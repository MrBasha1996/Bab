"use client"

import { useLocale } from "next-intl"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { setLocale } from "@/lib/actions/locale.actions"
import { type Locale } from "@/i18n/locales"

export function LanguageSwitcher() {
  const locale = useLocale() as Locale
  const [isPending, startTransition] = useTransition()

  const next: Locale = locale === "ar" ? "en" : "ar"
  const label = next === "en" ? "English" : "العربية"

  function toggle() {
    startTransition(() => void setLocale(next))
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      disabled={isPending}
      aria-label={label}
      title={label}
    >
      <span className="text-xs font-semibold">{next === "en" ? "EN" : "ع"}</span>
    </Button>
  )
}
