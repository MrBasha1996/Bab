import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

// عميل بصلاحية service role — للاستخدام الخادمي فقط (إنشاء مستخدمين عبر Admin
// API، أو أي عملية تتجاوز RLS عمداً). لا يُستدعى أبداً من مكوّن عميل.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
