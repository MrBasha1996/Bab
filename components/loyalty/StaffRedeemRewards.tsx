"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { redeemLoyaltyRewardForMember } from "@/lib/actions/loyalty.actions";
import { Button } from "@/components/ui/button";

export interface StaffRewardRow {
  id: string;
  name: string;
  pointsCost: number;
}

export function StaffRedeemRewards({
  memberId,
  pointsBalance,
  rewards,
}: {
  memberId: string;
  pointsBalance: number;
  rewards: StaffRewardRow[];
}) {
  const t = useTranslations("loyalty.scan");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onRedeem(reward: StaffRewardRow) {
    if (!confirm(t("redeemConfirm", { reward: reward.name, points: reward.pointsCost }))) return;
    startTransition(async () => {
      const result = await redeemLoyaltyRewardForMember(memberId, reward.id);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("redeemed"));
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      {rewards.length === 0 && <p className="text-sm text-muted-foreground">{t("noRewards")}</p>}
      {rewards.map((reward) => (
        <div key={reward.id} className="flex items-center justify-between rounded-md border p-3">
          <div>
            <p className="text-sm font-medium">{reward.name}</p>
            <p className="text-xs text-muted-foreground">{t("pointsCost", { points: reward.pointsCost })}</p>
          </div>
          <Button
            size="sm"
            disabled={isPending || pointsBalance < reward.pointsCost}
            onClick={() => onRedeem(reward)}
          >
            {t("redeemNow")}
          </Button>
        </div>
      ))}
    </div>
  );
}
