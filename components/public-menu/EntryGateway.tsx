import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { UtensilsCrossed, MessageSquareWarning, Star } from "lucide-react";
import { MenuHeader } from "@/components/public-menu/MenuHeader";
import type { ResolvedTable } from "@/lib/domain/resolve-table";

export async function EntryGateway({
  resolved,
  menuHref,
  complaintHref,
  ratingHref,
  tablet = false,
}: {
  resolved: ResolvedTable;
  menuHref: string;
  complaintHref: string;
  ratingHref: string;
  tablet?: boolean;
}) {
  const t = await getTranslations("publicMenu.gateway");

  const options = [
    { href: menuHref, label: t("menu"), icon: UtensilsCrossed },
    { href: complaintHref, label: t("complaint"), icon: MessageSquareWarning },
    { href: ratingHref, label: t("rating"), icon: Star },
  ];

  return (
    <div className={`mx-auto flex min-h-dvh flex-col ${tablet ? "max-w-2xl" : "max-w-md"}`}>
      <MenuHeader resolved={resolved} tablet={tablet} />
      <main className="flex flex-1 flex-col items-stretch justify-center gap-3 px-4 py-8 sm:px-6">
        {options.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-4 rounded-xl border bg-card p-5 text-card-foreground shadow-sm transition-colors hover:bg-muted/50 hover:shadow-md"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="size-5.5 text-primary" />
            </span>
            <span className="text-base font-medium">{label}</span>
          </Link>
        ))}

        {resolved.branch.googleMapsUrl ? (
          <div className="mt-2 grid gap-2">
            <span className="text-sm font-medium text-muted-foreground">{t("location")}</span>
            <div className="overflow-hidden rounded-xl border shadow-sm">
              <iframe
                src={resolved.branch.googleMapsUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-video w-full border-0"
                title={t("location")}
              />
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
