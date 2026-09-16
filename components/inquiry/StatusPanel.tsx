"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { updateInquiryStatus } from "@/lib/actions/inquiry.actions";
import type { InquiryStatusInput } from "@/lib/validation/inquiry.schema";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { FormCard } from "@/components/ui/form-card";

export function StatusPanel({
  inquiryId,
  status,
}: {
  inquiryId: string;
  status: InquiryStatusInput["status"];
}) {
  const t = useTranslations("inquiries.detail");
  const [value, setValue] = useState(status);
  const [isPending, startTransition] = useTransition();

  function onSave() {
    startTransition(async () => {
      const result = await updateInquiryStatus(inquiryId, { status: value });
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
          onChange={(e) => setValue(e.target.value as InquiryStatusInput["status"])}
        >
          <option value="new">{t("statusNew")}</option>
          <option value="read">{t("statusRead")}</option>
          <option value="resolved">{t("statusResolved")}</option>
        </Select>
      </div>
      <Button onClick={onSave} disabled={isPending} className="w-fit">
        {isPending ? t("saving") : t("save")}
      </Button>
    </FormCard>
  );
}
