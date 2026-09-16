import { createClient } from "@/lib/supabase/server";

export interface TableReservation {
  customerName: string;
  customerPhone: string;
  partySize: number;
  reservationTime: string;
  notes: string | null;
}

// يستدعي get_table_reservation (RPC، راجع 0008_menu_events.sql) بدل قراءة
// مباشرة من جدول reservations — لا سياسة anon عامة على الحجوزات (تسرّب بيانات
// عملاء عبر تطبيقات كل المطاعم)، الدالة تتحقق من qr_token فعلياً أولاً.
export async function getTableReservation(branchSlug: string, qrToken: string): Promise<TableReservation | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_table_reservation", {
    p_branch_slug: branchSlug,
    p_qr_token: qrToken,
  });

  const row = data?.[0];
  if (!row) return null;

  return {
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    partySize: row.party_size,
    reservationTime: row.reservation_time,
    notes: row.notes,
  };
}
