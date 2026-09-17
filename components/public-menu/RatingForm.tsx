"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Star } from "lucide-react";

import { ratingSchema, type RatingInput } from "@/lib/validation/rating.schema";
import { submitRating } from "@/lib/actions/rating.actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";
import { cn } from "@/lib/utils";

export function RatingForm({
  branchId,
  tableId,
  googleReviewsUrl,
}: {
  branchId: string;
  tableId: string;
  googleReviewsUrl: string | null;
}) {
  const t = useTranslations("publicMenu.rating");
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<RatingInput>({
    resolver: zodResolver(ratingSchema),
    defaultValues: { branchId, tableId, stars: 0, comment: "" },
  });

  function onSubmit(values: RatingInput) {
    startTransition(async () => {
      const result = await submitRating(values);
      if (!result.success) {
        toast.error(result.error ?? t("starsRequired"));
        return;
      }
      setSubmitted(true);
    });
  }

  if (submitted) {
    return (
      <div className="grid gap-3 rounded-xl border bg-card p-5 text-center text-card-foreground">
        <p className="text-sm">{t("success")}</p>
        {googleReviewsUrl ? (
          <a
            href={googleReviewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto flex w-fit items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted/50"
          >
            <Star className="size-4 text-primary" />
            {t("googleCta")}
          </a>
        ) : null}
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard>
          <FormField
            control={form.control}
            name="stars"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("stars")}</FormLabel>
                <FormControl>
                  <div className="flex justify-center gap-1 py-2">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        aria-label={String(value)}
                        className="p-1"
                      >
                        <Star
                          className={cn(
                            "size-9 transition-colors",
                            value <= field.value
                              ? "fill-primary text-primary"
                              : "fill-none text-muted-foreground",
                          )}
                        />
                      </button>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("comment")}</FormLabel>
                <FormControl>
                  <Textarea {...field} />
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
