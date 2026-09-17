"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { Building, User, Phone, Mail, MessageSquare, Send } from "lucide-react";

import { inquirySchema, type InquiryInput } from "@/lib/validation/inquiry.schema";
import { submitInquiry } from "@/lib/actions/public-inquiry.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";
import type { Locale } from "@/i18n/request";

export function ContactForm({ branches }: { branches: { id: string; label: string }[] }) {
  const t = useTranslations("site.contact");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();
  const form = useForm<InquiryInput>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      branchId: branches[0]?.id ?? "",
      name: "",
      phone: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: InquiryInput) {
    startTransition(async () => {
      const result = await submitInquiry(values);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("success"));
      form.reset({ ...values, subject: "", message: "" });
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard className="max-w-none">
          {branches.length > 0 && (
            <FormField
              control={form.control}
              name="branchId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Building className="size-4 text-primary" />
                    {t("branch")}
                  </FormLabel>
                  <FormControl>
                    <Select {...field}>
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.label}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <User className="size-4 text-primary" />
                    {t("name")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} placeholder={isAr ? "مثال: أحمد محمد" : "e.g. Ahmed Ali"} />
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
                  <FormLabel className="flex items-center gap-2">
                    <Phone className="size-4 text-primary" />
                    {t("phone")}
                  </FormLabel>
                  <FormControl>
                    <Input {...field} dir="ltr" placeholder="+966 5x xxx xxxx" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <Mail className="size-4 text-primary" />
                  {t("email")}
                </FormLabel>
                <FormControl>
                  <Input {...field} dir="ltr" placeholder="you@example.com" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="subject"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  {t("subject")}
                </FormLabel>
                <FormControl>
                  <Input {...field} placeholder={isAr ? "عنوان الرسالة" : "Subject line"} />
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
                <FormLabel className="flex items-center gap-2">
                  <MessageSquare className="size-4 text-primary" />
                  {t("message")}
                </FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder={isAr ? "اكتب رسالتك هنا…" : "Write your message here…"} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-fit">
            <Send className="size-4" />
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </FormCard>
      </form>
    </Form>
  );
}
