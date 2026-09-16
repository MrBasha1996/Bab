import { getTranslations, getLocale } from "next-intl/server";
import type { TableReservation } from "@/lib/domain/get-table-reservation";
import type { Locale } from "@/i18n/request";

export async function ReservationCard({ reservation }: { reservation: TableReservation }) {
  const locale = (await getLocale()) as Locale;
  const isAr = locale === "ar";
  const t = await getTranslations("publicMenu.reservation");

  return (
    <div className="mx-4 mt-4 grid gap-1 rounded-lg border bg-muted/30 p-3 text-sm sm:mx-6 sm:p-4">
      <span className="font-medium">{t("title")}</span>
      <span>{t("for", { name: reservation.customerName })}</span>
      <span>{t("party", { count: reservation.partySize })}</span>
      <span>
        {t("time", {
          time: new Date(reservation.reservationTime).toLocaleString(isAr ? "ar" : "en", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        })}
      </span>
      {reservation.notes && <span>{t("notes", { notes: reservation.notes })}</span>}
    </div>
  );
}
