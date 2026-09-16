import { config } from "dotenv";
import { Client } from "pg";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: join(process.cwd(), ".env.local") });

// مُشغِّل هجرات بسيط: يطبّق ملفات supabase/migrations/*.sql بالترتيب الأبجدي
// (الترقيم الرقمي في أسماء الملفات يضمن الترتيب الصحيح) ويتتبّع ما طُبِّق
// فعلاً في جدول public._migrations، فلا يُعاد تطبيق أي ملف مرتين.

const MIGRATIONS_DIR = join(process.cwd(), "supabase", "migrations");

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL غير موجود في البيئة");

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  await client.query(`
    create table if not exists public._migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    );
  `);

  const applied = new Set(
    (await client.query("select name from public._migrations")).rows.map((r) => r.name as string)
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(MIGRATIONS_DIR, file), "utf8");
    console.log(`Applying ${file} ...`);
    try {
      await client.query("begin");
      await client.query(sql);
      await client.query("insert into public._migrations (name) values ($1)", [file]);
      await client.query("commit");
      console.log(`  OK`);
    } catch (err) {
      await client.query("rollback");
      console.error(`  FAILED: ${(err as Error).message}`);
      await client.end();
      process.exit(1);
    }
  }

  console.log("All migrations applied.");
  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
