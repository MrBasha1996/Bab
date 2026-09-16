"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { tableSchema, type TableInput } from "@/lib/validation/table.schema";
import { createTable, updateTable } from "@/lib/actions/table.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select-radix";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

export function TableForm({
  tableId,
  defaultValues,
  branches,
}: {
  tableId?: string;
  defaultValues?: TableInput;
  branches?: { id: string; label: string }[];
}) {
  const t = useTranslations("tables.form");
  const [isPending, startTransition] = useTransition();
  const form = useForm<TableInput>({
    resolver: zodResolver(tableSchema),
    defaultValues: defaultValues ?? {
      branchId: branches?.[0]?.id ?? "",
      labelAr: "",
      labelEn: "",
    },
  });

  function onSubmit(values: TableInput) {
    startTransition(async () => {
      const result = tableId ? await updateTable(tableId, values) : await createTable(values);

      if (result && !result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      if (tableId) toast.success(t("saved"));
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard>
          {!tableId && branches && (
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
            name="labelAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labelAr")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="labelEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("labelEn")}</FormLabel>
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
