import { config } from "dotenv";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { Client } from "pg";
import { join } from "node:path";

config({ path: join(process.cwd(), ".env.local") });

const TEST_EMAIL = "e2e-loyalty@bab.local";
const TEST_PASSWORD = "E2E-loyalty-password-1!";
const TEST_PHONE = "0500000001";

// لا تجاوز/dev-bypass لـGoogle OAuth في الكود حالياً (قرار المستخدم: اختبار
// جزئي). بدل قيادة شاشة Google الفعلية، نُنشئ مستخدم اختبار بكلمة مرور، نسجّل
// دخوله عبر supabase-js مباشرة، ونلتقط الكوكيز التي تكتبها @supabase/ssr نفسها
// (بدل إعادة تنفيذ منطق ترميز/تقطيع الكوكي يدوياً) لحقنها لاحقاً في Playwright.
async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  if (!url || !anonKey || !serviceRoleKey || !databaseUrl) {
    throw new Error("متغيرات Supabase/DATABASE_URL غير موجودة في .env.local");
  }

  const admin = createAdminClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

  let page = 1;
  let userId: string | undefined;
  while (!userId) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    userId = data.users.find((u) => u.email === TEST_EMAIL)?.id;
    if (userId || data.users.length === 0) break;
    page += 1;
  }

  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) throw error ?? new Error("فشل إنشاء مستخدم اختبار الولاء");
    userId = data.user.id;
  } else {
    const { error } = await admin.auth.admin.updateUserById(userId, { password: TEST_PASSWORD });
    if (error) throw error;
  }

  const pg = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  let branchSlug: string;
  try {
    const { rows: branchRows } = await pg.query(
      `select b.id, b.slug, b.restaurant_id
       from public.branches b
       join public.menus m on m.branch_id = b.id
       join public.menu_categories mc on mc.menu_id = m.id
       join public.menu_category_items mci on mci.category_id = mc.id
       where b.deleted_at is null
       group by b.id, b.slug, b.restaurant_id
       having count(distinct mci.item_id) > 0
       order by count(distinct mci.item_id) desc
       limit 1`
    );
    const branch = branchRows[0];
    if (!branch) throw new Error("لا يوجد أي فرع بأصناف منيو فعلية لاختبار الولاء عليه");
    branchSlug = branch.slug;

    await pg.query(
      `insert into public.loyalty_members (restaurant_id, phone, auth_user_id)
       values ($1, $2, $3)
       on conflict (restaurant_id, phone) do update set auth_user_id = excluded.auth_user_id`,
      [branch.restaurant_id, TEST_PHONE, userId]
    );
  } finally {
    await pg.end();
  }

  const capturedCookies: { name: string; value: string; path: string; sameSite: "Lax" | "Strict" | "None" }[] = [];
  const supabase = createBrowserClient(url, anonKey, {
    isSingleton: false,
    cookies: {
      getAll: () => [],
      setAll: (cookiesToSet) => {
        for (const { name, value, options } of cookiesToSet) {
          if (!value) continue;
          const sameSite = options?.sameSite;
          capturedCookies.push({
            name,
            value,
            path: options?.path ?? "/",
            sameSite: sameSite === "strict" ? "Strict" : sameSite === "none" ? "None" : "Lax",
          });
        }
      },
    },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });
  if (signInError) throw signInError;

  console.log(JSON.stringify({ branchSlug, cookies: capturedCookies }));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
