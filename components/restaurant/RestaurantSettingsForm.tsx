"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { restaurantSchema, type RestaurantInput } from "@/lib/validation/restaurant.schema";
import { updateRestaurant } from "@/lib/actions/restaurant.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

export function RestaurantSettingsForm({
  restaurantId,
  defaultValues,
}: {
  restaurantId: string;
  defaultValues: RestaurantInput;
}) {
  const t = useTranslations("restaurant.settings");
  const [isPending, startTransition] = useTransition();
  const form = useForm<RestaurantInput>({
    resolver: zodResolver(restaurantSchema),
    defaultValues,
  });

  function onSubmit(values: RestaurantInput) {
    startTransition(async () => {
      const result = await updateRestaurant(restaurantId, values);
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
          <FormField
            control={form.control}
            name="aboutAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("aboutAr")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="aboutEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("aboutEn")}</FormLabel>
                <FormControl>
                  <Textarea {...field} dir="ltr" />
                </FormControl>
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
