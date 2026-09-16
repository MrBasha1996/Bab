"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateEventReservationStatus } from "@/lib/actions/event-reservation.actions";
import type { EventReservationStatusInput } from "@/lib/validation/event-reservation.schema";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormCard } from "@/components/ui/form-card";

export function StatusPanel({
  reservationId,
  status,
}: {
  reservationId: string;
  status: EventReservationStatusInput["status"];
}) {
  const t = useTranslations("eventReservations.detail");
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const result = await updateEventReservationStatus(reservationId, { status: value });
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
        <Select
          value={value}
          onChange={(e) => setValue(e.target.value as EventReservationStatusInput["status"])}
        >
          <option value="pending">{t("statusPending")}</option>
          <option value="confirmed">{t("statusConfirmed")}</option>
          <option value="rejected">{t("statusRejected")}</option>
        </Select>
      </div>
      <Button onClick={onSave} disabled={isPending} className="w-fit">
        {isPending ? t("saving") : t("save")}
      </Button>
    </FormCard>
  );
}
