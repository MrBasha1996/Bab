"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toggleItemAvailability } from "@/lib/actions/item.actions";
import { Switch } from "@/components/ui/switch";

export function AvailabilityToggle({ itemId, isAvailable }: { itemId: string; isAvailable: boolean }) {
  const t = useTranslations("menus.item");
  const [isPending, startTransition] = useTransition();

  function onToggle() {
    startTransition(async () => {
      const result = await toggleItemAvailability(itemId);
      if (!result.success) toast.error(result.error ?? t("genericError"));
    });
  }

  return (
    <label className="flex items-center gap-2 text-sm" onClick={(e) => e.stopPropagation()}>
      <Switch checked={isAvailable} disabled={isPending} onCheckedChange={onToggle} />
      {isAvailable ? t("available") : t("unavailable")}
    </label>
  );
}
