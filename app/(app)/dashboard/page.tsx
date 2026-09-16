import { getMessages, getTranslations } from "next-intl/server";
import Link from "next/link";
import { requireProfile } from "@/lib/auth/guards";
import { PageHeader } from "@/components/ui/page-header";
import { RestaurantOnboardingForm } from "@/components/restaurant/RestaurantOnboardingForm";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const profile = await requireProfile();

  if (!profile.restaurantId) {
    const t = await getTranslations("restaurant.onboarding");
    return (
      <div className="grid gap-6 p-6">
        <PageHeader title={t("title")} description={t("description")} />
        <RestaurantOnboardingForm />
      </div>
    );
  }

  const messages = await getMessages();
  const roleLabels = (messages.common as { roles?: Record<string, string> })?.roles ?? {};
  const roleLabel = profile.roleKey ? (roleLabels[profile.roleKey] ?? profile.roleKey) : "بلا دور";

  return (
    <div className="grid gap-6 p-6">
      <PageHeader title="لوحة التحكم" description={profile.fullName ?? profile.id} />
      <p className="text-muted-foreground text-sm">
        الدور: {roleLabel} — الفرع: {profile.branchId ?? "غير محدَّد"}
      </p>
      <Button asChild className="w-fit">
        <Link href="/branches">الفروع</Link>
      </Button>
    </div>
  );
}
