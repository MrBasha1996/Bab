"use server";
import { createClient } from "@/lib/supabase/server";

// تسجيل حدث مسح QR: أفضل جهد، لا يُفشِل تحميل الصفحة إن تعذّر (تحليلي بحت).
export async function recordQrScan(branchId: string, tableId: string, qrCodeId: string): Promise<void> {
  const supabase = await createClient();
  await supabase.from("qr_scan_events").insert({ branch_id: branchId, table_id: tableId, qr_code_id: qrCodeId });
}
