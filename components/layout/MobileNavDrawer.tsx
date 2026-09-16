"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import { useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { SidebarNavContent } from "@/components/layout/SidebarNavContent"

export function MobileNavDrawer({
  brandName,
  logoUrl,
}: {
  brandName?: string
  logoUrl?: string | null
}) {
  const t = useTranslations("common.nav")
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={t("openMenu")}>
          <Menu className="size-5" />
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="start-0 top-0 flex h-full w-72 max-w-[85vw] -translate-y-0 translate-x-0 flex-col gap-0 rounded-none bg-sidebar p-0 text-sidebar-foreground ring-0 rtl:translate-x-0 sm:max-w-72"
      >
        <DialogTitle className="sr-only">{t("menu")}</DialogTitle>
        <SidebarNavContent brandName={brandName} logoUrl={logoUrl} onNavigate={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
