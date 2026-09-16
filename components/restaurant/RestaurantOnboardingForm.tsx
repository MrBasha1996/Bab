"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { restaurantSchema, type RestaurantInput } from "@/lib/validation/restaurant.schema";
import { bootstrapRestaurant } from "@/lib/actions/restaurant.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export function RestaurantOnboardingForm() {
  const t = useTranslations("restaurant.onboarding");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const form = useForm<RestaurantInput>({
    resolver: zodResolver(restaurantSchema),
    defaultValues: { nameAr: "", nameEn: "" },
  });

  function onSubmit(values: RestaurantInput) {
    startTransition(async () => {
      const result = await bootstrapRestaurant(values);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      router.refresh();
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-sm gap-4">
        <FormField
          control={form.control}
          name="nameAr"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameAr")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="nameEn"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameEn")}</FormLabel>
              <FormControl>
                <Input {...field} dir="ltr" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending} className="w-fit">
          {isPending ? t("submitting") : t("submit")}
        </Button>
      </form>
    </Form>
  );
}
