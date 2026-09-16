import { SidebarNavContent } from "@/components/layout/SidebarNavContent"

export function AppSidebar({
  brandName,
  logoUrl,
}: {
  brandName?: string
  logoUrl?: string | null
}) {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-e bg-sidebar text-sidebar-foreground md:flex">
      <SidebarNavContent brandName={brandName} logoUrl={logoUrl} />
    </aside>
  )
}
