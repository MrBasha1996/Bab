"use client"

import { useSyncExternalStore } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Check, Laptop, Moon, Sun } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const noopSubscribe = () => () => {}

function useMounted() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false
  )
}

export function ThemeToggle() {
  const t = useTranslations("common.theme")
  const { theme, resolvedTheme, setTheme } = useTheme()
  const mounted = useMounted()

  const THEME_OPTIONS = [
    { value: "light", label: t("light"), icon: Sun },
    { value: "dark", label: t("dark"), icon: Moon },
    { value: "system", label: t("system"), icon: Laptop },
  ] as const

  if (!mounted) {
    return <Button variant="ghost" size="icon" disabled aria-hidden />
  }

  const isDark = resolvedTheme === "dark"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t("label")}>
          {isDark ? <Moon className="size-4" /> : <Sun className="size-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
          <DropdownMenuItem key={value} onClick={() => setTheme(value)} className="justify-between gap-4">
            <span className="flex items-center gap-2">
              <Icon className="size-4" />
              {label}
            </span>
            {theme === value && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
