"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { CalendarIcon, CheckCircle2 } from "lucide-react";

import {
  publicReservationSchema,
  type PublicReservationInput,
} from "@/lib/validation/public-reservation.schema";
import { submitPublicReservation } from "@/lib/actions/public-reservation.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";
import type { Locale } from "@/i18n/request";

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const totalMinutes = 12 * 60 + i * 30; // 12:00 -> 23:30
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, "0");
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  return `${hours}:${minutes}`;
});

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ReserveTableForm({ branches }: { branches: { id: string; label: string }[] }) {
  const t = useTranslations("site.reserve");
  const locale = useLocale() as Locale;
  const [isPending, startTransition] = useTransition();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmation, setConfirmation] = useState<{
    branchLabel: string;
    dateTimeLabel: string;
    partySize: number;
    name: string;
  } | null>(null);

  const form = useForm<PublicReservationInput>({
    resolver: zodResolver(publicReservationSchema),
    defaultValues: {
      branchId: branches[0]?.id ?? "",
      customerName: "",
      customerPhone: "",
      partySize: 2,
      reservationTime: "",
      notes: "",
    },
  });

  function applyDateTime(date: Date | undefined, time: string) {
    if (!date || !time) {
      form.setValue("reservationTime", "", { shouldValidate: false });
      return;
    }
    form.setValue("reservationTime", `${toDateKey(date)}T${time}`, { shouldValidate: true });
  }

  function onSubmit(values: PublicReservationInput) {
    startTransition(async () => {
      const result = await submitPublicReservation(values);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("success"));
      const branchLabel = branches.find((b) => b.id === values.branchId)?.label ?? "";
      const dateTimeLabel = selectedDate
        ? `${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(selectedDate)} — ${selectedTime}`
        : "";
      setConfirmation({ branchLabel, dateTimeLabel, partySize: values.partySize, name: values.customerName });
    });
  }

  function startNewReservation() {
    setConfirmation(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    form.reset({
      branchId: form.getValues("branchId"),
      customerName: "",
      customerPhone: "",
      partySize: 2,
      reservationTime: "",
      notes: "",
    });
  }

  if (confirmation) {
    return (
      <FormCard className="max-w-none">
        <div className="grid gap-1 text-center">
          <CheckCircle2 className="text-primary mx-auto size-10" />
          <h2 className="font-heading text-xl font-semibold">{t("confirmationTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("confirmationDescription")}</p>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationBranch")}</dt>
            <dd className="font-medium">{confirmation.branchLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationDateTime")}</dt>
            <dd className="font-medium">{confirmation.dateTimeLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationPartySize")}</dt>
            <dd className="font-medium">{confirmation.partySize}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationName")}</dt>
            <dd className="font-medium">{confirmation.name}</dd>
          </div>
        </dl>
        <Button type="button" variant="outline" className="w-fit" onClick={startNewReservation}>
          {t("confirmationNew")}
        </Button>
      </FormCard>
    );
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
                  <FormLabel>{t("branch")}</FormLabel>
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
          <FormField
            control={form.control}
            name="partySize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("partySize")}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    value={field.value}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <FormItem>
              <FormLabel>{t("date")}</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <Button type="button" variant="outline" className="w-full justify-start font-normal">
                    <CalendarIcon className="size-4" />
                    {selectedDate
                      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(selectedDate)
                      : t("pickDate")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      applyDateTime(date, selectedTime);
                    }}
                    disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                  />
                </PopoverContent>
              </Popover>
            </FormItem>
            <FormItem>
              <FormLabel>{t("time")}</FormLabel>
              <Select
                value={selectedTime}
                onChange={(e) => {
                  setSelectedTime(e.target.value);
                  applyDateTime(selectedDate, e.target.value);
                }}
              >
                <option value="" disabled>
                  {t("selectTime")}
                </option>
                {TIME_SLOTS.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </Select>
            </FormItem>
          </div>
          <FormField
            control={form.control}
            name="reservationTime"
            render={() => <FormMessage />}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("notes")}</FormLabel>
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
