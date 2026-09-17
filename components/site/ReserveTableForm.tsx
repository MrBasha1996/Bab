"use client";

import { useState, useTransition, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  CalendarIcon,
  CheckCircle2,
  Users,
  Store,
  Clock,
  ArrowLeft,
  ArrowRight,
  CalendarCheck,
  Pencil,
  PartyPopper,
  Phone,
  User,
  MessageSquare,
} from "lucide-react";

import {
  publicReservationSchema,
  type PublicReservationInput,
} from "@/lib/validation/public-reservation.schema";
import { submitPublicReservation } from "@/lib/actions/public-reservation.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";
import type { Locale } from "@/i18n/request";

const LUNCH_SLOTS = ["12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30"];
const DINNER_SLOTS = ["18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00", "21:30", "22:00", "22:30", "23:00", "23:30"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ReserveTableForm({ branches }: { branches: { id: string; label: string }[] }) {
  const t = useTranslations("site.reserve");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmation, setConfirmation] = useState<{
    branchLabel: string;
    dateTimeLabel: string;
    partySize: number;
    name: string;
  } | null>(null);

  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const ArrowBack = isAr ? ArrowRight : ArrowLeft;

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
    mode: "onChange",
  });

  const watchedBranch = form.watch("branchId");
  const watchedParty = form.watch("partySize");
  const watchedName = form.watch("customerName");
  const watchedPhone = form.watch("customerPhone");
  const watchedNotes = form.watch("notes");

  const selectedBranchLabel = useMemo(
    () => branches.find((b) => b.id === watchedBranch)?.label ?? "",
    [branches, watchedBranch]
  );

  function applyDateTime(date: Date | undefined, time: string) {
    if (!date || !time) {
      form.setValue("reservationTime", "", { shouldValidate: false });
      return;
    }
    form.setValue("reservationTime", `${toDateKey(date)}T${time}`, { shouldValidate: true });
  }

  function onSelectDate(date: Date | undefined) {
    setSelectedDate(date);
    applyDateTime(date, selectedTime);
  }

  function onSelectTime(time: string) {
    setSelectedTime(time);
    applyDateTime(selectedDate, time);
  }

  function canGoNext(): boolean {
    if (step === 1) return Boolean(watchedBranch) && Number(watchedParty) >= 1;
    if (step === 2) return Boolean(selectedDate) && Boolean(selectedTime);
    if (step === 3) return Boolean(watchedName?.trim()) && Boolean(watchedPhone?.trim());
    return true;
  }

  function nextStep() {
    if (!canGoNext()) return;
    setStep((s) => (s < 4 ? ((s + 1) as 1 | 2 | 3 | 4) : s));
  }

  function prevStep() {
    setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3 | 4) : s));
  }

  function goToStep(target: 1 | 2 | 3 | 4) {
    setStep(target);
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
    setStep(1);
    form.reset({
      branchId: form.getValues("branchId"),
      customerName: "",
      customerPhone: "",
      partySize: 2,
      reservationTime: "",
      notes: "",
    });
  }

  // ====== Confirmation view ======
  if (confirmation) {
    return (
      <FormCard className="max-w-none">
        <div className="grid gap-2 text-center">
          <div className="bg-success/10 text-success mx-auto grid size-14 place-items-center rounded-full">
            <CheckCircle2 className="size-7" />
          </div>
          <h2 className="font-display text-2xl font-bold">{t("confirmationTitle")}</h2>
          <p className="text-muted-foreground text-sm">{t("confirmationDescription")}</p>
        </div>
        <dl className="grid gap-2 rounded-xl bg-secondary/40 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationBranch")}</dt>
            <dd className="font-semibold">{confirmation.branchLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationDateTime")}</dt>
            <dd className="font-semibold" dir={isAr ? "rtl" : "ltr"}>{confirmation.dateTimeLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationPartySize")}</dt>
            <dd className="font-semibold">{confirmation.partySize}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("confirmationName")}</dt>
            <dd className="font-semibold">{confirmation.name}</dd>
          </div>
        </dl>
        <Button type="button" variant="outline" className="w-fit" onClick={startNewReservation}>
          <PartyPopper className="size-4" />
          {t("confirmationNew")}
        </Button>
      </FormCard>
    );
  }

  const stepLabels = [t("wizardStep1"), t("wizardStep2"), t("wizardStep3"), t("wizardStep4")];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard className="max-w-none">
          {/* ===== Wizard progress ===== */}
          <ol className="wizard-steps mb-2">
            {stepLabels.map((label, idx) => {
              const stepNum = (idx + 1) as 1 | 2 | 3 | 4;
              const isActive = step === stepNum;
              const isComplete = step > stepNum;
              return (
                <li key={stepNum} className="contents">
                  <button
                    type="button"
                    onClick={() => isComplete && goToStep(stepNum)}
                    className={`wizard-step ${isActive ? "is-active" : ""} ${isComplete ? "is-complete" : ""}`}
                    disabled={!isComplete}
                  >
                    <span className="wizard-step-circle">
                      {isComplete ? <CheckCircle2 className="size-3.5" /> : stepNum}
                    </span>
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                  {idx < stepLabels.length - 1 && <span className="wizard-step-line" aria-hidden />}
                </li>
              );
            })}
          </ol>

          {/* ===== STEP 1: Branch + Party size ===== */}
          {step === 1 && (
            <div className="grid gap-6">
              <div className="grid gap-2 text-center sm:text-start">
                <h2 className="font-display text-2xl font-bold">{t("step1Title")}</h2>
                <p className="text-muted-foreground text-sm">{t("step1Subtitle")}</p>
              </div>

              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Store className="size-4 text-primary" />
                      {t("branch")}
                    </FormLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {branches.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          data-selected={field.value === b.id ? "true" : "false"}
                          className="radio-card"
                          onClick={() => field.onChange(b.id)}
                        >
                          <span className="font-display text-base font-bold">{b.label}</span>
                          <span className="text-muted-foreground text-xs">باب البلد</span>
                        </button>
                      ))}
                      {branches.length === 0 ? (
                        <p className="text-muted-foreground text-sm">—</p>
                      ) : null}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partySize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      {t("partySize")}
                    </FormLabel>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="number-stepper">
                        <button
                          type="button"
                          aria-label="decrement"
                          disabled={Number(field.value) <= 1}
                          onClick={() => field.onChange(Math.max(1, Number(field.value) - 1))}
                        >
                          −
                        </button>
                        <span className="number-stepper-value">{field.value}</span>
                        <button
                          type="button"
                          aria-label="increment"
                          disabled={Number(field.value) >= 20}
                          onClick={() => field.onChange(Math.min(20, Number(field.value) + 1))}
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[2, 4, 6, 8].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => field.onChange(n)}
                            data-selected={Number(field.value) === n ? "true" : "false"}
                            className="radio-card min-w-16 !flex !flex-row items-center justify-center !px-4 !py-2"
                          >
                            <span className="font-bold">{n}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {t("minPartyHint")} · {t("maxPartyHint")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="button" onClick={nextStep} disabled={!canGoNext()} size="lg">
                  {t("nextStep")}
                  <Arrow className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Date + Time ===== */}
          {step === 2 && (
            <div className="grid gap-6">
              <div className="grid gap-2 text-center sm:text-start">
                <h2 className="font-display text-2xl font-bold">{t("step2Title")}</h2>
                <p className="text-muted-foreground text-sm">{t("step2Subtitle")}</p>
              </div>

              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CalendarIcon className="size-4 text-primary" />
                  {t("date")}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start font-normal sm:w-fit">
                      <CalendarIcon className="size-4" />
                      {selectedDate
                        ? new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(selectedDate)
                        : t("pickDate")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={onSelectDate}
                      disabled={{ before: new Date(new Date().setHours(0, 0, 0, 0)) }}
                    />
                  </PopoverContent>
                </Popover>
              </FormItem>

              {selectedDate ? (
                <div className="grid gap-6">
                  <div className="grid gap-3">
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      {t("lunch")}
                    </FormLabel>
                    <div className="time-grid">
                      {LUNCH_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          data-selected={selectedTime === slot ? "true" : "false"}
                          className="time-slot"
                          onClick={() => onSelectTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3">
                    <FormLabel className="flex items-center gap-2">
                      <Clock className="size-4 text-primary" />
                      {t("dinner")}
                    </FormLabel>
                    <div className="time-grid">
                      {DINNER_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          data-selected={selectedTime === slot ? "true" : "false"}
                          className="time-slot"
                          onClick={() => onSelectTime(slot)}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              <FormField
                control={form.control}
                name="reservationTime"
                render={() => <FormMessage />}
              />

              <div className="flex items-center justify-between">
                <Button type="button" onClick={prevStep} variant="ghost" size="lg">
                  <ArrowBack className="size-4" />
                  {t("prevStep")}
                </Button>
                <Button type="button" onClick={nextStep} disabled={!canGoNext()} size="lg">
                  {t("nextStep")}
                  <Arrow className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Contact info ===== */}
          {step === 3 && (
            <div className="grid gap-6">
              <div className="grid gap-2 text-center sm:text-start">
                <h2 className="font-display text-2xl font-bold">{t("step3Title")}</h2>
                <p className="text-muted-foreground text-sm">{t("step3Subtitle")}</p>
              </div>

              <FormField
                control={form.control}
                name="customerName"
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
                name="customerPhone"
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

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-primary" />
                      {t("notes")}
                    </FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={isAr ? "أي تفاصيل تود إضافتها…" : "Anything you'd like to add…"} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <Button type="button" onClick={prevStep} variant="ghost" size="lg">
                  <ArrowBack className="size-4" />
                  {t("prevStep")}
                </Button>
                <Button type="button" onClick={nextStep} disabled={!canGoNext()} size="lg">
                  {t("nextStep")}
                  <Arrow className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 4: Review & confirm ===== */}
          {step === 4 && (
            <div className="grid gap-6">
              <div className="grid gap-2 text-center sm:text-start">
                <h2 className="font-display text-2xl font-bold">{t("step4Title")}</h2>
                <p className="text-muted-foreground text-sm">{t("step4Subtitle")}</p>
              </div>

              <dl className="grid divide-y divide-border rounded-xl bg-secondary/40 overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                  <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Store className="size-4 text-primary" /> {t("selectedBranch")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2">
                    {selectedBranchLabel}
                    <button type="button" onClick={() => goToStep(1)} className="text-primary hover:underline text-xs">
                      <Pencil className="size-3 inline" /> {t("editStep")}
                    </button>
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                  <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Users className="size-4 text-primary" /> {t("selectedParty")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2">
                    {watchedParty}
                    <button type="button" onClick={() => goToStep(1)} className="text-primary hover:underline text-xs">
                      <Pencil className="size-3 inline" /> {t("editStep")}
                    </button>
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                  <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                    <CalendarCheck className="size-4 text-primary" /> {t("selectedDateTime")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2" dir={isAr ? "rtl" : "ltr"}>
                    {selectedDate
                      ? `${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(selectedDate)} — ${selectedTime}`
                      : "—"}
                    <button type="button" onClick={() => goToStep(2)} className="text-primary hover:underline text-xs">
                      <Pencil className="size-3 inline" /> {t("editStep")}
                    </button>
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                  <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                    <User className="size-4 text-primary" /> {t("selectedName")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2">
                    {watchedName || "—"}
                    <button type="button" onClick={() => goToStep(3)} className="text-primary hover:underline text-xs">
                      <Pencil className="size-3 inline" /> {t("editStep")}
                    </button>
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                  <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Phone className="size-4 text-primary" /> {t("selectedPhone")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2" dir="ltr">
                    {watchedPhone || "—"}
                    <button type="button" onClick={() => goToStep(3)} className="text-primary hover:underline text-xs">
                      <Pencil className="size-3 inline" /> {t("editStep")}
                    </button>
                  </dd>
                </div>
                {watchedNotes ? (
                  <div className="grid grid-cols-[1fr_auto] items-start gap-4 p-4">
                    <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                      <MessageSquare className="size-4 text-primary" /> {t("selectedNotes")}
                    </dt>
                    <dd className="font-medium max-w-xs text-end">{watchedNotes}</dd>
                  </div>
                ) : null}
              </dl>

              <div className="flex items-center justify-between">
                <Button type="button" onClick={prevStep} variant="ghost" size="lg">
                  <ArrowBack className="size-4" />
                  {t("prevStep")}
                </Button>
                <Button type="submit" disabled={isPending} size="lg">
                  {isPending ? t("submitting") : t("submit")}
                </Button>
              </div>
            </div>
          )}
        </FormCard>
      </form>
    </Form>
  );
}
