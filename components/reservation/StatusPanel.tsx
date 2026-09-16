"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateReservationStatus } from "@/lib/actions/reservation.actions";
import type { ReservationStatusInput } from "@/lib/validation/reservation.schema";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";
import { FormCard } from "@/components/ui/form-card";

export function StatusPanel({
  reservationId,
  status,
}: {
  reservationId: string;
  status: ReservationStatusInput["status"];
}) {
  const t = useTranslations("reservations.detail");
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const result = await updateReservationStatus(reservationId, { status: value });
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("saved"));
    });
  }

  return (
    <FormCard>
      <div className="grid gap-2">
        <label className="text-sm font-medium">{t("status")}</label>
        <Select value={value} onValueChange={(v) => setValue(v as ReservationStatusInput["status"])}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">{t("statusPending")}</SelectItem>
            <SelectItem value="confirmed">{t("statusConfirmed")}</SelectItem>
            <SelectItem value="cancelled">{t("statusCancelled")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button onClick={onSave} disabled={isPending} className="w-fit">
        {isPending ? t("saving") : t("save")}
      </Button>
    </FormCard>
  );
}
