import { getTranslations } from "next-intl/server";
import { requireProfile } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/page-header";
import { EventReservationForm } from "@/components/event-reservation/EventReservationForm";

export default async function NewEventReservationPage() {
  await requireProfile();
  const t = await getTranslations("eventReservations.pages");
  const supabase = await createClient();
  const { data: branches } = await supabase.from("branches").select("id, name_ar").order("name_ar");

  return (
    <div className="grid gap-6 p-6">
      <PageHeader backHref="/event-reservations" title={t("newTitle")} />
      <EventReservationForm branches={(branches ?? []).map((b) => ({ id: b.id, label: b.name_ar }))} />
    </div>
  );
}
