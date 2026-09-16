"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateLoyaltyRedemptionStatus } from "@/lib/actions/loyalty.actions";
import { Button } from "@/components/ui/button";

export function ScanRedemptionActions({
  redemptionId,
  rewardName,
  pointsSpent,
}: {
  redemptionId: string;
  rewardName: string;
  pointsSpent: number;
}) {
  const t = useTranslations("loyalty.scan");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function fulfill() {
    startTransition(async () => {
      const result = await updateLoyaltyRedemptionStatus(redemptionId, { status: "fulfilled" });
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("fulfilled"));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <div>
        <p className="text-sm font-medium">{rewardName}</p>
        <p className="text-xs text-muted-foreground">{t("pointsCost", { points: pointsSpent })}</p>
      </div>
      <Button size="sm" disabled={isPending} onClick={fulfill}>
        {t("fulfill")}
      </Button>
    </div>
  );
}
