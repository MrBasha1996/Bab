"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createLoyaltyReward, deleteLoyaltyReward, updateLoyaltyReward } from "@/lib/actions/loyalty.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FormCard } from "@/components/ui/form-card";

export interface LoyaltyRewardRow {
  id: string;
  nameAr: string;
  nameEn: string;
  pointsCost: number;
  isActive: boolean;
}

export function LoyaltyRewardsPanel({ rewards }: { rewards: LoyaltyRewardRow[] }) {
  const t = useTranslations("loyalty.rewards");
  const router = useRouter();
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [pointsCost, setPointsCost] = useState("");
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    startTransition(async () => {
      const result = await createLoyaltyReward({
        nameAr,
        nameEn,
        pointsCost: Number(pointsCost) || 0,
        isActive: true,
      });
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      setNameAr("");
      setNameEn("");
      setPointsCost("");
      router.refresh();
    });
  }

  function onToggleActive(reward: LoyaltyRewardRow) {
    startTransition(async () => {
      const result = await updateLoyaltyReward(reward.id, {
        nameAr: reward.nameAr,
        nameEn: reward.nameEn,
        pointsCost: reward.pointsCost,
        isActive: !reward.isActive,
      });
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteLoyaltyReward(id);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <FormCard className="max-w-xl">
      <h2 className="text-sm font-semibold">{t("title")}</h2>
      <div className="grid gap-2">
        {rewards.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        {rewards.map((reward) => (
          <div key={reward.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm">
            <span className="min-w-0 truncate">
              {reward.nameAr} / {reward.nameEn} — {t("pointsCostValue", { points: reward.pointsCost })}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <Switch
                checked={reward.isActive}
                onCheckedChange={() => onToggleActive(reward)}
                disabled={isPending}
              />
              <Button variant="ghost" size="sm" disabled={isPending} onClick={() => onDelete(reward.id)}>
                {t("delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Input placeholder={t("nameAr")} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        <Input placeholder={t("nameEn")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
        <Input
          placeholder={t("pointsCost")}
          type="number"
          min="1"
          dir="ltr"
          value={pointsCost}
          onChange={(e) => setPointsCost(e.target.value)}
        />
        <Button type="button" disabled={isPending || !nameAr || !nameEn || !pointsCost} onClick={onAdd}>
          {t("add")}
        </Button>
      </div>
    </FormCard>
  );
}
