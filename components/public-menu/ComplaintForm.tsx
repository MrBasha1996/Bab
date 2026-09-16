"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { complaintSchema, type ComplaintInput } from "@/lib/validation/complaint.schema";
import { submitComplaint } from "@/lib/actions/complaint.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

export function ComplaintForm({ branchId, tableId }: { branchId: string; tableId: string }) {
  const t = useTranslations("publicMenu.complaint");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<ComplaintInput>({
    resolver: zodResolver(complaintSchema),
    defaultValues: {
      branchId,
      tableId,
      type: "complaint",
      message: "",
      customerName: "",
      customerPhone: "",
    },
  });

  function onSubmit(values: ComplaintInput) {
    startTransition(async () => {
      const result = await submitComplaint(values);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return <p className="rounded-xl border bg-card p-5 text-center text-sm text-card-foreground">{t("success")}</p>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard>
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("type")}</FormLabel>
                <FormControl>
                  <Select {...field}>
                    <option value="complaint">{t("typeComplaint")}</option>
                    <option value="suggestion">{t("typeSuggestion")}</option>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("message")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("name")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="customerPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("phone")}</FormLabel>
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
        </FormCard>
      </form>
    </Form>
  );
}
