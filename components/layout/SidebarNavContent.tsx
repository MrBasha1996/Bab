"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
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
  BarChart3,
  Settings,
} from "lucide-react";

import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
};

type NavGroup = {
  groupKey: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    groupKey: "navGroups.operations",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: LayoutDashboard },
      { href: "/branches", labelKey: "nav.branches", icon: Store },
      { href: "/tables", labelKey: "nav.tables", icon: Table2 },
      { href: "/reservations", labelKey: "nav.reservations", icon: CalendarClock },
      { href: "/event-reservations", labelKey: "nav.eventReservations", icon: PartyPopper },
    ],
  },
  {
    groupKey: "navGroups.catalog",
    items: [
      { href: "/menus", labelKey: "nav.menus", icon: BookOpen },
      { href: "/items", labelKey: "nav.items", icon: UtensilsCrossed },
    ],
  },
  {
    groupKey: "navGroups.engagement",
    items: [
      { href: "/inquiries", labelKey: "nav.inquiries", icon: MessageSquare },
      { href: "/complaints", labelKey: "nav.complaints", icon: MessageSquareWarning },
      { href: "/loyalty", labelKey: "nav.loyalty", icon: Gift },
    ],
  },
  {
    groupKey: "navGroups.insights",
    items: [{ href: "/analytics", labelKey: "nav.analytics", icon: BarChart3 }],
  },
  {
    groupKey: "navGroups.settings",
    items: [{ href: "/restaurant", labelKey: "nav.restaurantSettings", icon: Settings }],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

export function SidebarNavContent({
  brandName = "Digital Menu",
  logoUrl,
  onNavigate,
}: {
  brandName?: string;
  logoUrl?: string | null;
  onNavigate?: () => void;
}) {
  const t = useTranslations("common");
  const pathname = usePathname();

  return (
    <>
      {/* Brand header — larger, more elegant */}
      <div className="flex items-center gap-3 border-b border-sidebar-border bg-sidebar-accent/30 px-4 py-4">
        {logoUrl ? (
          <Image
            src={logoUrl}
            alt={brandName}
            width={40}
            height={40}
            unoptimized
            className="size-10 shrink-0 rounded-lg object-cover ring-1 ring-brand-accent/30"
          />
        ) : (
          <div className="bg-brand-accent text-brand-accent-on grid size-10 shrink-0 place-items-center rounded-lg font-display text-sm font-bold ring-1 ring-brand-accent/30">
            {brandName.slice(0, 1)}
          </div>
        )}
        <div className="min-w-0 grid gap-0.5">
          <p className="truncate font-display text-sm font-bold text-sidebar-foreground">{brandName}</p>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-sidebar-accent-foreground/60">
            Digital Menu
          </p>
        </div>
      </div>

      <nav className="sidebar-scroll min-h-0 flex-1 overflow-y-auto px-2 py-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.groupKey} className="grid gap-0.5">
            <span className="sidebar-section-label">{t(group.groupKey)}</span>
            {group.items.map(({ href, labelKey, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(`${href}/`);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={onNavigate}
                  className={cn(
                    "group/item relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-brand-accent/15 font-semibold text-brand-accent"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  {/* Active left accent bar */}
                  <span
                    className={cn(
                      "absolute inset-y-1.5 start-0 w-1 rounded-full bg-brand-accent transition-opacity",
                      active ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform",
                      active ? "text-brand-accent" : "text-sidebar-foreground/60 group-hover/item:scale-110"
                    )}
                  />
                  <span className="truncate">{t(labelKey)}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer mini badge */}
      <div className="border-t border-sidebar-border bg-sidebar-accent/20 px-3 py-2">
        <p className="text-center text-[10px] font-semibold text-sidebar-accent-foreground/40">
          © {new Date().getFullYear()} {brandName}
        </p>
      </div>
    </>
  );
}
