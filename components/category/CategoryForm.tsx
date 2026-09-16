"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { categorySchema, type CategoryInput } from "@/lib/validation/category.schema";
import { createCategory, updateCategory } from "@/lib/actions/category.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

export function CategoryForm({
  categoryId,
  menuId,
  branchId,
  defaultValues,
}: {
  categoryId?: string;
  menuId: string;
  branchId: string;
  defaultValues?: CategoryInput;
}) {
  const t = useTranslations("menus.category.form");
  const [isPending, startTransition] = useTransition();
  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues ?? { menuId, branchId, nameAr: "", nameEn: "", sortOrder: 0 },
  });

  function onSubmit(values: CategoryInput) {
    startTransition(async () => {
      const result = categoryId ? await updateCategory(categoryId, menuId, values) : await createCategory(values);
      if (result && !result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      if (categoryId) toast.success(t("saved"));
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
          <Button type="submit" disabled={isPending} className="w-fit">
            {isPending ? t("saving") : t("save")}
          </Button>
        </FormCard>
      </form>
    </Form>
  );
}
