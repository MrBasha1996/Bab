"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import {
  LayoutDashboard,
  Store,
  BookOpen,
  UtensilsCrossed,
  Table2,
  CalendarClock,
  PartyPopper,
  Gift,
  MessageSquare,
  MessageSquareWarning,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"

export const NAV_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/branches", labelKey: "nav.branches", icon: Store },
  { href: "/menus", labelKey: "nav.menus", icon: BookOpen },
  { href: "/items", labelKey: "nav.items", icon: UtensilsCrossed },
  { href: "/tables", labelKey: "nav.tables", icon: Table2 },
  { href: "/reservations", labelKey: "nav.reservations", icon: CalendarClock },
  { href: "/event-reservations", labelKey: "nav.eventReservations", icon: PartyPopper },
  { href: "/inquiries", labelKey: "nav.inquiries", icon: MessageSquare },
  { href: "/complaints", labelKey: "nav.complaints", icon: MessageSquareWarning },
  { href: "/loyalty", labelKey: "nav.loyalty", icon: Gift },
  { href: "/restaurant", labelKey: "nav.restaurantSettings", icon: Settings },
] as const

export function SidebarNavContent({
  brandName = "Digital Menu",
  logoUrl,
  onNavigate,
}: {
  brandName?: string
  logoUrl?: string | null
  onNavigate?: () => void
}) {
  const t = useTranslations("common")
  const pathname = usePathname()

  return (
    <>
      <div className="flex items-center gap-2 border-b border-sidebar-border p-3">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={brandName}
            width={36}
            height={36}
            unoptimized
            className="size-9 shrink-0 rounded-md object-contain"
          />
        ) : (
          <div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-semibold text-sidebar-accent-foreground">
            {brandName.slice(0, 1)}
          </div>
        )}
        <p className="truncate text-sm font-semibold text-sidebar-foreground">{brandName}</p>
      </div>
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_ITEMS.map(({ href, labelKey, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-brand-accent/10 font-medium text-brand-accent"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
            >
              <Icon className="size-4 shrink-0" />
              {t(labelKey)}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
