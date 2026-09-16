import { getLocale } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppTopbar } from "@/components/layout/AppTopbar";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const profile = await requireProfile();

  if (!profile.restaurantId) {
    return (
      <div className="flex min-h-full flex-1 flex-col">
        <AppTopbar fullName={profile.fullName} roleKey={profile.roleKey} />
        {children}
      </div>
    );
  }

  const locale = await getLocale();
  const supabase = await createClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name_ar, name_en, logo_url")
    .eq("id", profile.restaurantId)
    .single();

  const brandName = (locale === "en" ? restaurant?.name_en : restaurant?.name_ar) || "Digital Menu";
  const logoUrl = restaurant?.logo_url ?? null;

  return (
    <div className="flex min-h-full flex-1">
      <AppSidebar brandName={brandName} logoUrl={logoUrl} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar
          fullName={profile.fullName}
          roleKey={profile.roleKey}
          showNavTrigger
          brandName={brandName}
          logoUrl={logoUrl}
        />
        {children}
      </div>
    </div>
  );
}
