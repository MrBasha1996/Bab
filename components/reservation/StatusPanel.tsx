"use client";

import { useState, useTransition } from "react";
import { useTranslations, useLocale } from "next-intl";
import { toast } from "sonner";
import {
  Check,
  X,
  Clock,
  CalendarCheck,
  CalendarX,
  ChevronLeft,
  ChevronRight,
  History,
} from "lucide-react";

import { updateReservationStatus } from "@/lib/actions/reservation.actions";
import type { ReservationStatusInput } from "@/lib/validation/reservation.schema";
import { Button } from "@/components/ui/button";
import { FormCard } from "@/components/ui/form-card";
import type { Locale } from "@/i18n/request";

type Status = ReservationStatusInput["status"];

const STATUS_ORDER: Status[] = ["pending", "confirmed", "cancelled"];

const STATUS_META: Record<
  Status,
  {
    icon: React.ComponentType<{ className?: string }>;
    tone: "warning" | "success" | "danger";
    labelKey: "statusPending" | "statusConfirmed" | "statusCancelled";
    descKey: "statusPendingDesc" | "statusConfirmedDesc" | "statusCancelledDesc";
  }
> = {
  pending: {
    icon: Clock,
    tone: "warning",
    labelKey: "statusPending",
    descKey: "statusPendingDesc",
  },
  confirmed: {
    icon: CalendarCheck,
    tone: "success",
    labelKey: "statusConfirmed",
    descKey: "statusConfirmedDesc",
  },
  cancelled: {
    icon: CalendarX,
    tone: "danger",
    labelKey: "statusCancelled",
    descKey: "statusCancelledDesc",
  },
};

const toneClasses = {
  warning: {
    chip: "bg-warning/15 text-warning border-warning/30",
    ring: "ring-warning/30",
    bar: "bg-warning",
  },
  success: {
    chip: "bg-success/15 text-success border-success/30",
    ring: "ring-success/30",
    bar: "bg-success",
  },
  danger: {
    chip: "bg-destructive/15 text-destructive border-destructive/30",
    ring: "ring-destructive/30",
    bar: "bg-destructive",
  },
};

export function StatusPanel({
  reservationId,
  status,
}: {
  reservationId: string;
  status: Status;
}) {
  const t = useTranslations("reservations.detail");
  const locale = useLocale() as Locale;
  const isAr = locale === "ar";
  const [value, setValue] = useState<Status>(status);
  const [isPending, startTransition] = useTransition();

  const currentIndex = STATUS_ORDER.indexOf(value);

  function onChange(next: Status) {
    setValue(next);
    startTransition(async () => {
      const result = await updateReservationStatus(reservationId, { status: next });
      if (!result.success) {
        toast.error(result.error ?? t("genericError"));
        setValue(value); // revert
        return;
      }
      toast.success(t("saved"));
    });
  }

  // Suggested next status: pending→confirmed, then no further auto
  const suggestedNext: Status | null = value === "pending" ? "confirmed" : null;

  return (
    <FormCard>
      <div className="grid gap-4">
        <div className="flex items-center gap-2">
          <History className="size-4 text-primary" />
          <h3 className="font-display text-sm font-bold">{t("statusTimeline")}</h3>
        </div>

        {/* Visual timeline */}
        <ol className="grid gap-1">
          {STATUS_ORDER.map((s, idx) => {
            const meta = STATUS_META[s];
            const Icon = meta.icon;
            const tone = toneClasses[meta.tone];
            const isComplete = idx < currentIndex;
            const isActive = idx === currentIndex;
            const isFuture = idx > currentIndex;
            const isCancelled = value === "cancelled";

            // For cancelled state: pending shows "skipped"
            const showAsSkipped = isCancelled && idx === 0;

            return (
              <li key={s} className="relative grid grid-cols-[auto_1fr] gap-3">
                {/* Vertical line */}
                {idx < STATUS_ORDER.length - 1 ? (
                  <span
                    className={`absolute top-7 start-5 h-[calc(100%-0.5rem)] w-0.5 ${
                      isComplete ? tone.bar : "bg-border"
                    }`}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={() => onChange(s)}
                  disabled={isPending || (isActive && !showAsSkipped)}
                  className={`grid size-10 place-items-center rounded-full border-2 ring-4 transition-all
                    ${isActive ? `${tone.chip} border-current ${tone.ring}` : ""}
                    ${isComplete ? `${tone.chip} border-transparent` : ""}
                    ${isFuture || showAsSkipped ? "bg-muted text-muted-foreground border-border" : ""}
                    ${isPending ? "opacity-50 cursor-wait" : "cursor-pointer hover:scale-105"}
                  `}
                  aria-pressed={isActive}
                >
                  {isComplete ? (
                    <Check className="size-4" />
                  ) : showAsSkipped ? (
                    <X className="size-4" />
                  ) : (
                    <Icon className="size-4" />
                  )}
                </button>

                <div className={`min-w-0 grid gap-0.5 pt-1.5 ${isFuture ? "opacity-50" : ""}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-bold ${isActive ? "" : ""}`}>
                      {t(meta.labelKey)}
                    </span>
                    {isActive ? (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${tone.chip}`}
                      >
                        {isAr ? "الحالة الحالية" : "Current"}
                      </span>
                    ) : null}
                    {showAsSkipped ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                        {isAr ? "متخطّاة" : "Skipped"}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-xs leading-relaxed">
                    {t(meta.descKey)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>

        {/* Quick action button */}
        {suggestedNext ? (
          <div className="grid gap-2 border-t pt-3">
            <p className="text-muted-foreground text-xs">
              {isAr ? "إجراء سريع:" : "Quick action:"}
            </p>
            <Button
              type="button"
              onClick={() => onChange(suggestedNext)}
              disabled={isPending}
              className="w-fit"
              size="sm"
            >
              <Check className="size-4" />
              {isAr ? "تأكيد الحجز" : "Confirm reservation"}
            </Button>
          </div>
        ) : null}

        {value === "cancelled" ? (
          <div className="bg-destructive/10 text-destructive grid gap-1 rounded-xl border border-destructive/20 p-3 text-xs">
            <p className="font-bold flex items-center gap-1.5">
              <X className="size-4" />
              {isAr ? "تم إلغاء هذا الحجز" : "This reservation was cancelled"}
            </p>
            <button
              type="button"
              onClick={() => onChange("pending")}
              disabled={isPending}
              className="text-destructive/80 hover:text-destructive w-fit text-xs underline"
            >
              {isAr ? "إعادة تنشيط الحجز (pending)" : "Reactivate (set to pending)"}
            </button>
          </div>
        ) : value === "confirmed" ? (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => onChange("cancelled")}
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors"
            >
              <CalendarX className="size-3.5" />
              {isAr ? "إلغاء الحجز" : "Cancel reservation"}
            </button>
          </div>
        ) : null}
      </div>
    </FormCard>
  );
}
