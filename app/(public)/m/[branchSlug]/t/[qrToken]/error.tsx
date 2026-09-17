"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function PublicMenuError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("publicMenu.error");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">{t("title")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{t("description")}</p>
      <Button onClick={() => retry()} className="mt-2">
        {t("retry")}
      </Button>
    </div>
  );
}
