import { config } from "dotenv";
import { Client } from "pg";
import { join } from "node:path";

config({ path: join(process.cwd(), ".env.local") });

const TABLE_LABEL = "E2E Test Table";

// يستخدم أول مطعم/فرع موجود فعلياً في القاعدة (بدل إنشاء مطعم تجريبي جديد)
// لتفادي تلويث القاعدة الحية ببيانات لا علاقة لها بالمنيو الفعلي. الطاولة نفسها
// idempotent: يعيد استخدام نفس الصف إن كان موجوداً بدل إنشاء طاولة جديدة كل مرة.
async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL غير موجود في البيئة");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    const { rows: branchRows } = await client.query(
      `select b.id, b.slug
       from public.branches b
       join public.menus m on m.branch_id = b.id
       join public.menu_categories mc on mc.menu_id = m.id
       join public.menu_category_items mci on mci.category_id = mc.id
       where b.deleted_at is null
       group by b.id, b.slug
       having count(distinct mci.item_id) > 0
       order by count(distinct mci.item_id) desc
       limit 1`
    );
    const branch = branchRows[0];
    if (!branch) throw new Error("لا يوجد أي فرع بأصناف منيو فعلية لإنشاء طاولة اختبار عليه");

    const { rows: existingTableRows } = await client.query(
      `select id from public.tables where branch_id = $1 and label_en = $2 and deleted_at is null`,
      [branch.id, TABLE_LABEL]
    );

    let tableId: string;
    if (existingTableRows[0]) {
      tableId = existingTableRows[0].id;
    } else {
      const { rows: insertedTableRows } = await client.query(
        `insert into public.tables (branch_id, label_ar, label_en) values ($1, $2, $3) returning id`,
        [branch.id, "طاولة اختبار E2E", TABLE_LABEL]
      );
      tableId = insertedTableRows[0].id;
    }

    const { rows: existingQrRows } = await client.query(
      `select qr_token from public.table_qr_codes where table_id = $1 and is_active = true`,
      [tableId]
    );

    let qrToken: string;
    if (existingQrRows[0]) {
      qrToken = existingQrRows[0].qr_token;
    } else {
      const { rows: insertedQrRows } = await client.query(
        `insert into public.table_qr_codes (table_id, branch_id) values ($1, $2) returning qr_token`,
        [tableId, branch.id]
      );
      qrToken = insertedQrRows[0].qr_token;
    }

    console.log(JSON.stringify({ branchSlug: branch.slug, qrToken, tableId }));
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
