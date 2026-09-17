import { getMessages } from "next-intl/server";
import { Bell, Search } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LogoutButton } from "@/components/layout/LogoutButton";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { Button } from "@/components/ui/button";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "؟";
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[parts.length - 1][0]}`;
}

export async function AppTopbar({
  fullName,
  roleKey,
  showNavTrigger = false,
  brandName,
  logoUrl,
}: {
  fullName?: string | null;
  roleKey?: string | null;
  showNavTrigger?: boolean;
  brandName?: string;
  logoUrl?: string | null;
}) {
  const messages = await getMessages();
  const roleLabels = (messages.common as { roles?: Record<string, string> })?.roles ?? {};
  const roleLabel = roleKey ? roleLabels[roleKey] ?? roleKey : null;

  return (
    <header className="bg-sidebar/95 supports-[backdrop-filter]:bg-sidebar/80 sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-sidebar-border px-4 text-sidebar-foreground backdrop-blur-sm">
      {showNavTrigger && (
        <div className="md:hidden">
          <MobileNavDrawer brandName={brandName} logoUrl={logoUrl} />
        </div>
      )}

      {/* Search box (hidden on mobile) */}
      <div className="hidden md:block">
        <div className="bg-sidebar-accent/40 text-sidebar-foreground/60 flex h-9 w-64 items-center gap-2 rounded-full border border-transparent px-3 text-sm transition-colors focus-within:border-brand-accent focus-within:bg-sidebar-accent">
          <Search className="size-4" />
          <input
            type="search"
            placeholder="بحث…"
            className="bg-transparent text-sidebar-foreground placeholder:text-sidebar-foreground/40 w-full border-0 outline-none"
          />
        </div>
      </div>

      <div className="flex flex-1" />

      <div className="flex items-center gap-1.5">
        {/* Notification bell with pulsing dot */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="relative has-notification text-sidebar-foreground/80 hover:text-sidebar-foreground"
          aria-label="Notifications"
        >
          <Bell className="size-4" />
        </Button>

        <LanguageSwitcher />
        <ThemeToggle />

        <div className="bg-sidebar-border mx-1 h-6 w-px" />

        <LogoutButton />
        {fullName && (
          <div className="flex items-center gap-2 ps-1">
            <Avatar size="sm">
              <AvatarFallback>{initials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="hidden text-sm leading-tight sm:block">
              <div className="font-medium text-sidebar-foreground">{fullName}</div>
              {roleLabel && (
                <div className="text-[11px] text-sidebar-foreground/60">{roleLabel}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
