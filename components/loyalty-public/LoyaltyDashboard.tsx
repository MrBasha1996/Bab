"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Award, Gift, QrCode, Receipt } from "lucide-react";

import { redeemLoyaltyReward, submitLoyaltyReceipt } from "@/lib/actions/loyalty-member.actions";
import { Button } from "@/components/ui/button";

export interface LoyaltyTierRow {
  id: string;
  nameAr: string;
  nameEn: string;
  minPoints: number;
}

export interface LoyaltyRewardRow {
  id: string;
  nameAr: string;
  nameEn: string;
  pointsCost: number;
}

export interface LoyaltyHistoryRow {
  id: string;
  type: "earn" | "redeem";
  label: string | null;
  points: number;
  status: "pending_ocr" | "approved" | "rejected" | "pending" | "fulfilled" | "cancelled";
  createdAt: string;
}

export function LoyaltyDashboard({
  memberId,
  branchId,
  pointsBalance,
  qrDataUrl,
  tiers,
  rewards,
  history,
  isArabic,
}: {
  memberId: string;
  branchId: string;
  pointsBalance: number;
  qrDataUrl: string;
  tiers: LoyaltyTierRow[];
  rewards: LoyaltyRewardRow[];
  history: LoyaltyHistoryRow[];
  isArabic: boolean;
}) {
  const t = useTranslations("loyalty.customer");
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();

  const sortedTiers = [...tiers].sort((a, b) => a.minPoints - b.minPoints);
  const currentTier = [...sortedTiers].reverse().find((tier) => pointsBalance >= tier.minPoints);
  const nextTier = sortedTiers.find((tier) => tier.minPoints > pointsBalance);
  const progressPercent = nextTier
    ? Math.min(100, Math.round((pointsBalance / nextTier.minPoints) * 100))
    : 100;

  function onUpload() {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    startTransition(async () => {
      const result = await submitLoyaltyReceipt(memberId, branchId, formData);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("receiptSubmitted"));
      setFile(null);
      router.refresh();
    });
  }

  function onRedeem(rewardId: string) {
    startTransition(async () => {
      const result = await redeemLoyaltyReward(rewardId);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("redeemed"));
      router.refresh();
    });
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-2xl border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-6 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Award className="size-6" />
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t("balance")}</p>
        <p className="text-5xl font-bold text-primary">{pointsBalance}</p>
        {currentTier && (
          <p className="mt-1 text-sm font-medium">
            {t("currentTier", { tier: isArabic ? currentTier.nameAr : currentTier.nameEn })}
          </p>
        )}
        {nextTier && (
          <div className="mt-4 grid gap-1.5">
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {t("nextTier", {
                tier: isArabic ? nextTier.nameAr : nextTier.nameEn,
                points: nextTier.minPoints - pointsBalance,
              })}
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-3 rounded-2xl border p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-sm font-medium">
          <QrCode className="size-4 text-primary" />
          {t("qrTitle")}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrDataUrl} alt={t("qrTitle")} className="mx-auto w-48 rounded-lg border p-2" />
        <p className="text-xs text-muted-foreground">{t("qrHint")}</p>
      </div>

      <div className="grid gap-2 rounded-2xl border p-5">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Receipt className="size-4 text-primary" />
          {t("uploadReceipt")}
        </p>
        <p className="text-xs text-muted-foreground">{t("uploadReceiptHint")}</p>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-sm"
        />
        <Button onClick={onUpload} disabled={!file || isPending} className="w-fit">
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </div>

      <div className="grid gap-2">
        <p className="flex items-center gap-2 text-sm font-medium">
          <Gift className="size-4 text-primary" />
          {t("rewards")}
        </p>
        {rewards.length === 0 && <p className="text-sm text-muted-foreground">{t("noRewards")}</p>}
        {rewards.map((reward) => (
          <div
            key={reward.id}
            className="flex items-center justify-between rounded-xl border bg-card p-3.5 shadow-xs"
          >
            <div>
              <p className="text-sm font-medium">{isArabic ? reward.nameAr : reward.nameEn}</p>
              <p className="text-xs text-muted-foreground">{t("pointsCost", { points: reward.pointsCost })}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isPending || pointsBalance < reward.pointsCost}
              onClick={() => onRedeem(reward.id)}
            >
              {t("redeem")}
            </Button>
          </div>
        ))}
      </div>

      <div className="grid gap-2">
        <p className="text-sm font-medium">{t("history")}</p>
        {history.length === 0 && <p className="text-sm text-muted-foreground">{t("noHistory")}</p>}
        {history.map((entry) => {
          const isEarn = entry.type === "earn";
          const label = isEarn
            ? t(`earnStatus.${entry.status}`)
            : entry.label ?? t(`redeemStatus.${entry.status}`);
          return (
            <div
              key={entry.id}
              className="flex items-center justify-between rounded-lg border bg-card px-3.5 py-2.5 text-sm"
            >
              <div className="grid gap-0.5">
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </span>
              </div>
              <span
                className={
                  isEarn && entry.status === "approved"
                    ? "font-semibold text-primary"
                    : !isEarn && entry.status !== "cancelled"
                      ? "font-semibold text-destructive"
                      : "text-muted-foreground"
                }
              >
                {isEarn ? "+" : "-"}
                {entry.points}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
