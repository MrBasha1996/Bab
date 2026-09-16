"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { menuSchema, type MenuInput } from "@/lib/validation/menu.schema";
import { createMenu, updateMenu } from "@/lib/actions/menu.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

export function MenuForm({
  menuId,
  defaultValues,
  branches,
}: {
  menuId?: string;
  defaultValues?: MenuInput;
  branches?: { id: string; label: string }[];
}) {
  const t = useTranslations("menus.form");
  const [isPending, startTransition] = useTransition();
  const form = useForm<MenuInput>({
    resolver: zodResolver(menuSchema),
    defaultValues: defaultValues ?? { branchId: branches?.[0]?.id ?? "", nameAr: "", nameEn: "" },
  });

  function onSubmit(values: MenuInput) {
    startTransition(async () => {
      const result = menuId ? await updateMenu(menuId, values) : await createMenu(values);
      if (result && !result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      if (menuId) toast.success(t("saved"));
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard>
          {!menuId && branches && branches.length > 1 && (
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("branch")}</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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
            {isPending ? t("saving") : t("save")}
          </Button>
        </FormCard>
      </form>
    </Form>
  );
}
