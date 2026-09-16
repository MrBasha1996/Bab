import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { UtensilsCrossed, MessageSquareWarning, Star } from "lucide-react";
import { MenuHeader } from "@/components/public-menu/MenuHeader";
import type { ResolvedTable } from "@/lib/domain/resolve-table";

export async function EntryGateway({
  resolved,
  menuHref,
  complaintHref,
  tablet = false,
}: {
  resolved: ResolvedTable;
  menuHref: string;
  complaintHref: string;
  tablet?: boolean;
}) {
  const t = await getTranslations("publicMenu.gateway");

  const options = [
    { href: menuHref, label: t("menu"), icon: UtensilsCrossed, external: false },
    { href: complaintHref, label: t("complaint"), icon: MessageSquareWarning, external: false },
    resolved.branch.googleReviewsUrl
      ? { href: resolved.branch.googleReviewsUrl, label: t("review"), icon: Star, external: true }
      : null,
  ].filter((option): option is NonNullable<typeof option> => option !== null);

  return (
    <div className={`mx-auto flex min-h-dvh flex-col ${tablet ? "max-w-2xl" : "max-w-md"}`}>
      <MenuHeader resolved={resolved} tablet={tablet} />
      <main className="flex flex-1 flex-col items-stretch justify-center gap-4 px-4 py-8 sm:px-6">
        {options.map(({ href, label, icon: Icon, external }) => (
          <Link
            key={href}
            href={href}
            target={external ? "_blank" : undefined}
            rel={external ? "noopener noreferrer" : undefined}
            className="flex items-center gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-colors hover:bg-muted/50"
          >
            <Icon className="size-7 shrink-0 text-primary" />
            <span className="text-base font-medium">{label}</span>
          </Link>
        ))}
      </main>
    </div>
  );
}
