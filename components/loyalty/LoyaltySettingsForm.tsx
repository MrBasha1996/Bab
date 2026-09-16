"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { loyaltySettingsSchema, type LoyaltySettingsInput } from "@/lib/validation/loyalty.schema";
import { upsertLoyaltySettings } from "@/lib/actions/loyalty.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

export function LoyaltySettingsForm({ defaultValues }: { defaultValues: LoyaltySettingsInput }) {
  const t = useTranslations("loyalty.settings");
  const [isPending, startTransition] = useTransition();
  const form = useForm<LoyaltySettingsInput>({
    resolver: zodResolver(loyaltySettingsSchema),
    defaultValues,
  });

  function onSubmit(values: LoyaltySettingsInput) {
    startTransition(async () => {
      const result = await upsertLoyaltySettings(values);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("saved"));
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard>
          <FormField
            control={form.control}
            name="pointsPerCurrencyUnit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("pointsPerCurrencyUnit")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.0001"
                    min="0"
                    dir="ltr"
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormDescription>{t("pointsPerCurrencyUnitHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? t("saving") : t("save")}
          </Button>
        </FormCard>
      </form>
    </Form>
  );
}
