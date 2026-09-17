"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("common.errors");

  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 px-4 text-center">
      <h2 className="text-lg font-semibold">{t("errorTitle")}</h2>
      <p className="max-w-sm text-sm text-muted-foreground">{t("errorDescription")}</p>
      <div className="mt-2 flex gap-2">
        <Button onClick={() => retry()}>{t("retry")}</Button>
        <Button variant="outline" asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </div>
    </div>
  );
}
