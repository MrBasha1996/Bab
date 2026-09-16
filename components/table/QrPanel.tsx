"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { regenerateQr, disableQr } from "@/lib/actions/table.actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function QrPanel({
  tableId,
  qrDataUrl,
  isActive,
  fileName,
}: {
  tableId: string;
  qrDataUrl: string;
  isActive: boolean;
  fileName: string;
}) {
  const t = useTranslations("tables.qr");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRegenerate() {
    if (!confirm(t("regenerateConfirm"))) return;
    startTransition(async () => {
      const result = await regenerateQr(tableId);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("regenerated"));
      router.refresh();
    });
  }

  function handleDisable() {
    if (!confirm(t("disableConfirm"))) return;
    startTransition(async () => {
      const result = await disableQr(tableId);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("disabled"));
      router.refresh();
    });
  }

  return (
    <Card className="max-w-sm">
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {isActive ? t("active") : t("inactive")}
          </span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={fileName} className="mx-auto w-48" />
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <a href={qrDataUrl} download={`${fileName}.png`}>
              {t("download")}
            </a>
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            {t("print")}
          </Button>
          <Button variant="outline" disabled={isPending} onClick={handleRegenerate}>
            {t("regenerate")}
          </Button>
          <Button variant="destructive" disabled={isPending || !isActive} onClick={handleDisable}>
            {t("disable")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
