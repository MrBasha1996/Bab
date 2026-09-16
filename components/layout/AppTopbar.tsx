import { getMessages } from "next-intl/server"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher"
import { ThemeToggle } from "@/components/layout/ThemeToggle"
import { LogoutButton } from "@/components/layout/LogoutButton"
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "؟"
  if (parts.length === 1) return parts[0].slice(0, 2)
  return `${parts[0][0]}${parts[parts.length - 1][0]}`
}

export async function AppTopbar({
  fullName,
  roleKey,
  showNavTrigger = false,
  brandName,
  logoUrl,
}: {
  fullName?: string | null
  roleKey?: string | null
  showNavTrigger?: boolean
  brandName?: string
  logoUrl?: string | null
}) {
  const messages = await getMessages()
  const roleLabels = (messages.common as { roles?: Record<string, string> })?.roles ?? {}
  const roleLabel = roleKey ? (roleLabels[roleKey] ?? roleKey) : null

  return (
    <header className="flex h-14 items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 text-sidebar-foreground">
      {showNavTrigger && (
        <div className="md:hidden">
          <MobileNavDrawer brandName={brandName} logoUrl={logoUrl} />
        </div>
      )}
      <div className="flex flex-1" />
      <div className="flex items-center gap-2">
        <LanguageSwitcher />
        <ThemeToggle />
        <LogoutButton />
        {fullName && (
          <div className="flex items-center gap-2 ps-1">
            <Avatar size="sm">
              <AvatarFallback>{initials(fullName)}</AvatarFallback>
            </Avatar>
            <div className="text-sm leading-tight">
              <div className="font-medium text-sidebar-foreground">{fullName}</div>
              {roleLabel && <div className="text-[11px] text-muted-foreground">{roleLabel}</div>}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
