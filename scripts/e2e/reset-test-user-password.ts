import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { join } from "node:path";

config({ path: join(process.cwd(), ".env.local") });

const TEST_EMAIL = "human-owner@bab.local";
const TEST_PASSWORD = "E2E-test-password-1!";

// يعيد ضبط كلمة مرور حساب اختبار موجود مسبقاً (مذكور في تاريخ المرحلة 5 من
// tasks/todo.md) بدل إنشاء حساب جديد، لتفادي تكرار حسابات اختبار متروكة في
// القاعدة الحية. كلمة المرور ثابتة ومعروفة هنا فقط لأنها لحساب اختباري بلا
// بيانات حساسة فعلية.
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("متغيرات Supabase غير موجودة في .env.local");

  const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  let userId: string | undefined;
  let page = 1;
  while (!userId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    userId = data.users.find((u) => u.email === TEST_EMAIL)?.id;
    if (userId || data.users.length === 0) break;
    page += 1;
  }

  if (!userId) throw new Error(`المستخدم ${TEST_EMAIL} غير موجود — يجب إنشاؤه يدوياً أولاً`);

  const { error: updateError } = await admin.auth.admin.updateUserById(userId, { password: TEST_PASSWORD });
  if (updateError) throw updateError;

  console.log(`تم ضبط كلمة مرور ${TEST_EMAIL} بنجاح`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
