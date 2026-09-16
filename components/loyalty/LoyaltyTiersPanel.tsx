"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { createLoyaltyTier, deleteLoyaltyTier } from "@/lib/actions/loyalty.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormCard } from "@/components/ui/form-card";

export interface LoyaltyTierRow {
  id: string;
  nameAr: string;
  nameEn: string;
  minPoints: number;
}

export function LoyaltyTiersPanel({ tiers }: { tiers: LoyaltyTierRow[] }) {
  const t = useTranslations("loyalty.tiers");
  const router = useRouter();
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [minPoints, setMinPoints] = useState("0");
  const [isPending, startTransition] = useTransition();

  function onAdd() {
    startTransition(async () => {
      const result = await createLoyaltyTier({ nameAr, nameEn, minPoints: Number(minPoints) || 0 });
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      setNameAr("");
      setNameEn("");
      setMinPoints("0");
      router.refresh();
    });
  }

  function onDelete(id: string) {
    startTransition(async () => {
      const result = await deleteLoyaltyTier(id);
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
        {tiers.length === 0 && <p className="text-sm text-muted-foreground">{t("empty")}</p>}
        {tiers.map((tier) => (
          <div key={tier.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
            <span>
              {tier.nameAr} / {tier.nameEn} — {t("minPointsValue", { points: tier.minPoints })}
            </span>
            <Button variant="ghost" size="sm" disabled={isPending} onClick={() => onDelete(tier.id)}>
              {t("delete")}
            </Button>
          </div>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        <Input placeholder={t("nameAr")} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        <Input placeholder={t("nameEn")} value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
        <Input
          placeholder={t("minPoints")}
          type="number"
          min="0"
          dir="ltr"
          value={minPoints}
          onChange={(e) => setMinPoints(e.target.value)}
        />
        <Button type="button" disabled={isPending || !nameAr || !nameEn} onClick={onAdd}>
          {t("add")}
        </Button>
      </div>
    </FormCard>
  );
}
