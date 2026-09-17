"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  PartyPopper,
  Building2,
  CalendarIcon,
  Users,
  User,
  Phone,
  Building,
  MessageSquare,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Pencil,
  Gift,
} from "lucide-react";

import {
  publicEventReservationSchema,
  type PublicEventReservationInput,
} from "@/lib/validation/public-event-reservation.schema";
import { submitPublicEventReservation } from "@/lib/actions/public-event-reservation.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { FormCard } from "@/components/ui/form-card";
import type { Locale } from "@/i18n/request";

const EVENT_TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00", "20:00", "21:00"];

function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function EventRequestForm({ branches }: { branches: { id: string; label: string }[] }) {
  const t = useTranslations("site.events");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState("");
  const [confirmation, setConfirmation] = useState<{
    type: "event" | "corporate";
    branchLabel: string;
    dateTimeLabel: string;
    guestCount: number;
    contactName: string;
  } | null>(null);

  const Arrow = isAr ? ArrowLeft : ArrowRight;
  const ArrowBack = isAr ? ArrowRight : ArrowLeft;

  const form = useForm<PublicEventReservationInput>({
    resolver: zodResolver(publicEventReservationSchema),
    defaultValues: {
      branchId: branches[0]?.id ?? "",
      reservationType: "event",
      companyName: "",
      contactName: "",
      contactPhone: "",
      guestCount: 10,
      eventDate: "",
      notes: "",
    },
    mode: "onChange",
  });

  const watchedType = form.watch("reservationType");
  const watchedBranch = form.watch("branchId");
  const watchedGuests = form.watch("guestCount");
  const watchedCompany = form.watch("companyName");
  const watchedContactName = form.watch("contactName");
  const watchedContactPhone = form.watch("contactPhone");
  const watchedNotes = form.watch("notes");

  const selectedBranchLabel = branches.find((b) => b.id === watchedBranch)?.label ?? "";

  function applyDateTime(date: Date | undefined, time: string) {
    if (!date || !time) {
      form.setValue("eventDate", "", { shouldValidate: false });
      return;
    }
    form.setValue("eventDate", `${toDateKey(date)}T${time}`, { shouldValidate: true });
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
    if (step === 1) return Boolean(watchedBranch) && Boolean(watchedType);
    if (step === 2) return Boolean(selectedDate) && Boolean(selectedTime) && Number(watchedGuests) >= 1;
    if (step === 3) return Boolean(watchedContactName?.trim()) && Boolean(watchedContactPhone?.trim());
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

  function onSubmit(values: PublicEventReservationInput) {
    startTransition(async () => {
      const result = await submitPublicEventReservation(values);
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        return;
      }
      toast.success(t("success"));
      const branchLabel = branches.find((b) => b.id === values.branchId)?.label ?? "";
      const dateTimeLabel = selectedDate
        ? `${new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(selectedDate)} — ${selectedTime}`
        : "";
      setConfirmation({
        type: values.reservationType,
        branchLabel,
        dateTimeLabel,
        guestCount: values.guestCount,
        contactName: values.contactName,
      });
    });
  }

  function startNew() {
    setConfirmation(null);
    setSelectedDate(undefined);
    setSelectedTime("");
    setStep(1);
    form.reset({
      branchId: form.getValues("branchId"),
      reservationType: "event",
      companyName: "",
      contactName: "",
      contactPhone: "",
      guestCount: 10,
      eventDate: "",
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
          <h2 className="font-display text-2xl font-bold">{t("success")}</h2>
          <p className="text-muted-foreground text-sm">{t("step4Subtitle")}</p>
        </div>
        <dl className="grid gap-2 rounded-xl bg-secondary/40 p-4 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("selectedType")}</dt>
            <dd className="font-semibold">
              {confirmation.type === "event" ? t("typeEvent") : t("typeCorporate")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("selectedBranch")}</dt>
            <dd className="font-semibold">{confirmation.branchLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("selectedDate")}</dt>
            <dd className="font-semibold" dir={isAr ? "rtl" : "ltr"}>{confirmation.dateTimeLabel}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("selectedGuests")}</dt>
            <dd className="font-semibold">{confirmation.guestCount}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">{t("selectedContact")}</dt>
            <dd className="font-semibold">{confirmation.contactName}</dd>
          </div>
        </dl>
        <Button type="button" variant="outline" className="w-fit" onClick={startNew}>
          <Gift className="size-4" />
          {t("submit")}
        </Button>
      </FormCard>
    );
  }

  const stepLabels = [t("wizardStep1"), t("wizardStep2"), t("wizardStep3"), t("wizardStep4")];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormCard className="max-w-none">
          {/* Wizard progress */}
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

          {/* ===== STEP 1: Type + Branch ===== */}
          {step === 1 && (
            <div className="grid gap-6">
              <div className="grid gap-2 text-center sm:text-start">
                <h2 className="font-display text-2xl font-bold">{t("step1Title")}</h2>
                <p className="text-muted-foreground text-sm">{t("step1Subtitle")}</p>
              </div>

              <FormField
                control={form.control}
                name="reservationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <PartyPopper className="size-4 text-primary" />
                      {t("type")}
                    </FormLabel>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <button
                        type="button"
                        data-selected={field.value === "event" ? "true" : "false"}
                        onClick={() => field.onChange("event")}
                        className="radio-card"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/10 text-primary grid size-11 place-items-center rounded-xl">
                            <PartyPopper className="size-5" />
                          </span>
                          <div className="grid gap-0.5">
                            <span className="font-display text-base font-bold">{t("typeEvent")}</span>
                            <span className="text-muted-foreground text-xs">{t("typeEventDesc")}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {t("eventTypeInfo")}
                        </p>
                      </button>
                      <button
                        type="button"
                        data-selected={field.value === "corporate" ? "true" : "false"}
                        onClick={() => field.onChange("corporate")}
                        className="radio-card"
                      >
                        <div className="flex items-center gap-3">
                          <span className="bg-info/10 text-info grid size-11 place-items-center rounded-xl">
                            <Building2 className="size-5" />
                          </span>
                          <div className="grid gap-0.5">
                            <span className="font-display text-base font-bold">{t("typeCorporate")}</span>
                            <span className="text-muted-foreground text-xs">{t("typeCorporateDesc")}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground text-xs leading-relaxed">
                          {t("corporateTypeInfo")}
                        </p>
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="branchId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building className="size-4 text-primary" />
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

              <div className="flex justify-end">
                <Button type="button" onClick={nextStep} disabled={!canGoNext()} size="lg">
                  {t("nextStep")}
                  <Arrow className="size-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ===== STEP 2: Date + Guests ===== */}
          {step === 2 && (
            <div className="grid gap-6">
              <div className="grid gap-2 text-center sm:text-start">
                <h2 className="font-display text-2xl font-bold">{t("step2Title")}</h2>
                <p className="text-muted-foreground text-sm">{t("step2Subtitle")}</p>
              </div>

              <FormItem>
                <FormLabel className="flex items-center gap-2">
                  <CalendarIcon className="size-4 text-primary" />
                  {t("eventDate")}
                </FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="w-full justify-start font-normal sm:w-fit">
                      <CalendarIcon className="size-4" />
                      {selectedDate
                        ? new Intl.DateTimeFormat(locale, { dateStyle: "full" }).format(selectedDate)
                        : t("eventDate")}
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
                <div className="grid gap-3">
                  <FormLabel className="flex items-center gap-2">
                    <Clock className="size-4 text-primary" />
                    {t("eventTime")}
                  </FormLabel>
                  <div className="time-grid">
                    {EVENT_TIMES.map((slot) => (
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
              ) : null}

              <FormField
                control={form.control}
                name="guestCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="size-4 text-primary" />
                      {t("guestCount")}
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
                          disabled={Number(field.value) >= 500}
                          onClick={() => field.onChange(Math.min(500, Number(field.value) + 1))}
                        >
                          +
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {[20, 50, 100, 200].map((n) => (
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
                      {t("minGuestsHint")} · {t("maxGuestsHint")}
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="eventDate"
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

              {watchedType === "corporate" ? (
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Building2 className="size-4 text-primary" />
                        {t("companyName")}
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={isAr ? "مثال: شركة الواحة" : "e.g. Al Waha Co."} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="size-4 text-primary" />
                      {t("contactName")}
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
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Phone className="size-4 text-primary" />
                      {t("contactPhone")}
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
                      <Textarea
                        {...field}
                        placeholder={isAr ? "تفاصيل المناسبة، نوع المنيو المطلوب، متطلبات خاصة…" : "Event details, menu preferences, special requirements…"}
                      />
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
                    <PartyPopper className="size-4 text-primary" /> {t("selectedType")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2">
                    {watchedType === "event" ? t("typeEvent") : t("typeCorporate")}
                    <button type="button" onClick={() => goToStep(1)} className="text-primary hover:underline text-xs">
                      <Pencil className="size-3 inline" /> {t("editStep")}
                    </button>
                  </dd>
                </div>
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                  <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                    <Building className="size-4 text-primary" /> {t("selectedBranch")}
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
                    <CalendarIcon className="size-4 text-primary" /> {t("selectedDate")}
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
                    <Users className="size-4 text-primary" /> {t("selectedGuests")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2">
                    {watchedGuests} {isAr ? "ضيف" : "guests"}
                    <button type="button" onClick={() => goToStep(2)} className="text-primary hover:underline text-xs">
                      <Pencil className="size-3 inline" /> {t("editStep")}
                    </button>
                  </dd>
                </div>
                {watchedCompany ? (
                  <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                    <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Building2 className="size-4 text-primary" /> {t("selectedCompany")}
                    </dt>
                    <dd className="font-semibold flex items-center gap-2">
                      {watchedCompany}
                      <button type="button" onClick={() => goToStep(3)} className="text-primary hover:underline text-xs">
                        <Pencil className="size-3 inline" /> {t("editStep")}
                      </button>
                    </dd>
                  </div>
                ) : null}
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-4">
                  <dt className="flex items-center gap-2 text-muted-foreground text-sm">
                    <User className="size-4 text-primary" /> {t("selectedContact")}
                  </dt>
                  <dd className="font-semibold flex items-center gap-2">
                    {watchedContactName || "—"}
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
                    {watchedContactPhone || "—"}
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
