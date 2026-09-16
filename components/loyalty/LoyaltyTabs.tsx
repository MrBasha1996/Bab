import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/loyalty/settings", labelKey: "settingsTab" },
  { href: "/loyalty/redemptions", labelKey: "redemptionsTab" },
  { href: "/loyalty/submissions", labelKey: "submissionsTab" },
] as const;

export async function LoyaltyTabs({ active }: { active: (typeof TABS)[number]["href"] }) {
  const t = await getTranslations("loyalty.pages");

  return (
    <div className="flex gap-2 border-b pb-2">
      {TABS.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm",
            tab.href === active
              ? "bg-primary/10 font-medium text-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t(tab.labelKey)}
        </Link>
      ))}
    </div>
  );
}
