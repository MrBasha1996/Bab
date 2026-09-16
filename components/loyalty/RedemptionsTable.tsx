"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateLoyaltyRedemptionStatus } from "@/lib/actions/loyalty.actions";
import type { LoyaltyRedemptionStatusInput } from "@/lib/validation/loyalty.schema";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export interface RedemptionRow {
  id: string;
  memberPhone: string;
  rewardNameAr: string;
  rewardNameEn: string;
  pointsSpent: number;
  status: LoyaltyRedemptionStatusInput["status"];
  createdAt: string;
}

export function RedemptionsTable({ rows }: { rows: RedemptionRow[] }) {
  const t = useTranslations("loyalty.redemptions");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onStatusChange(id: string, status: LoyaltyRedemptionStatusInput["status"]) {
    startTransition(async () => {
      const result = await updateLoyaltyRedemptionStatus(id, { status });
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("member")}</TableHead>
          <TableHead>{t("reward")}</TableHead>
          <TableHead>{t("pointsSpent")}</TableHead>
          <TableHead>{t("status")}</TableHead>
          <TableHead>{t("createdAt")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell dir="ltr" className="text-end">
              {row.memberPhone}
            </TableCell>
            <TableCell>
              {row.rewardNameAr} / {row.rewardNameEn}
            </TableCell>
            <TableCell>{row.pointsSpent}</TableCell>
            <TableCell>
              <Select
                value={row.status}
                disabled={isPending}
                onChange={(e) =>
                  onStatusChange(row.id, e.target.value as LoyaltyRedemptionStatusInput["status"])
                }
              >
                <option value="pending">{t("statusPending")}</option>
                <option value="fulfilled">{t("statusFulfilled")}</option>
                <option value="cancelled">{t("statusCancelled")}</option>
              </Select>
            </TableCell>
            <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
