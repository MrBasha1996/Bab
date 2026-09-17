import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common.errors");

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">{t("notFoundTitle")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{t("notFoundDescription")}</p>
      <Button asChild className="mt-2">
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </div>
  );
}
