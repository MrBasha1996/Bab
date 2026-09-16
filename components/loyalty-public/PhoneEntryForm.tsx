"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { joinLoyaltyMember } from "@/lib/actions/loyalty-member.actions";
import { normalizeSaudiPhone } from "@/lib/domain/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormCard } from "@/components/ui/form-card";

// يظهر بعد أول دخول Google حين لا توجد عضوية ولاء بعد لهذا المطعم — رقم
// الهاتف يُتحقق منه محلياً (بلا SMS) عبر normalizeSaudiPhone قبل الإرسال
// (راجع 14.6 في tasks/todo.md).
export function PhoneEntryForm({ restaurantId }: { restaurantId: string }) {
  const t = useTranslations("loyalty.auth");
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [isPending, startTransition] = useTransition();
  const isValidPhone = normalizeSaudiPhone(phone) !== null;

  function confirm() {
    if (!isValidPhone) {
      toast.error(t("invalidPhone"));
      return;
    }
    startTransition(async () => {
      const result = await joinLoyaltyMember(restaurantId, phone.trim());
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <FormCard className="mx-auto w-full max-w-sm">
      <h1 className="text-center text-lg font-semibold">{t("phoneEntryTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("phoneEntryHint")}</p>
      <Input
        dir="ltr"
        type="tel"
        placeholder={t("phonePlaceholder")}
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
      />
      <Button onClick={confirm} disabled={isPending || !isValidPhone}>
        {isPending ? t("saving") : t("confirmPhone")}
      </Button>
    </FormCard>
  );
}
