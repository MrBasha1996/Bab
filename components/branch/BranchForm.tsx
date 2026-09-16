"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { branchSchema, type BranchInput } from "@/lib/validation/branch.schema";
import { createBranch, updateBranch } from "@/lib/actions/branch.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";

export function BranchForm({
  branchId,
  defaultValues,
}: {
  branchId?: string;
  defaultValues?: BranchInput;
}) {
  const t = useTranslations("branches.form");
  const [isPending, startTransition] = useTransition();
  const form = useForm<BranchInput>({
    resolver: zodResolver(branchSchema),
    defaultValues: defaultValues ?? {
      nameAr: "",
      nameEn: "",
      addressAr: "",
      addressEn: "",
      phone: "",
      googleReviewsUrl: "",
      googleMapsUrl: "",
      timezone: "Asia/Riyadh",
    },
  });

  function onSubmit(values: BranchInput) {
    startTransition(async () => {
      const result = branchId ? await updateBranch(branchId, values) : await createBranch(values);

      if (result && !result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      if (branchId) toast.success(t("saved"));
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
            name="addressAr"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("addressAr")}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="addressEn"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("addressEn")}</FormLabel>
                <FormControl>
                  <Input {...field} dir="ltr" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="phone"
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
          <FormField
            control={form.control}
            name="googleReviewsUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("googleReviewsUrl")}</FormLabel>
                <FormControl>
                  <Input {...field} dir="ltr" placeholder="https://g.page/r/..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="googleMapsUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("googleMapsUrl")}</FormLabel>
                <FormControl>
                  <Input {...field} dir="ltr" placeholder="https://www.google.com/maps/embed?..." />
                </FormControl>
                <FormDescription>{t("googleMapsUrlHint")}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("timezone")}</FormLabel>
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
