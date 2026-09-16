// سكربت استيراد لمرة واحدة: يقرأ data/import/bab-albalad/menu.json (نتيجة
// scripts/scrape/bab-albalad.ts) وينشئ مطعم "باب البلد" كاملاً في القاعدة
// الحية (restaurant → branch → menu → categories → items + allergens)، مع رفع
// كل الصور المحلية إلى bucket التخزين menu-images عبر عميل service role.
//
// تشغيل: npx tsx scripts/import/bab-albalad.ts

import { config } from "dotenv";
config({ path: ".env.local" });

import { Client } from "pg";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data", "import", "bab-albalad");
const IMAGES_DIR = join(DATA_DIR, "images");
const BUCKET = "menu-images";
const STORAGE_PREFIX = "bab-albalad";

interface RawAllergen {
  name_ar: string;
  name_en: string;
  icon_file: string | null;
}

interface RawItem {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  price: number;
  calories: number | null;
  image_file: string | null;
  allergens: RawAllergen[];
}

interface RawCategory {
  name_ar: string;
  name_en: string;
  items: RawItem[];
}

interface MenuJson {
  restaurant: { name_ar: string; name_en: string; logo_file: string | null };
  categories: RawCategory[];
}

async function main() {
  const menu: MenuJson = JSON.parse(readFileSync(join(DATA_DIR, "menu.json"), "utf8"));

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error("متغيرات Supabase غير موجودة في البيئة");
  const storage = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  // مفاتيح Supabase Storage يجب أن تكون ASCII فقط — أسماء ملفات المُسبِّبات
  // (allergens) تحتوي عربياً (مصدرها اسم المُسبِّب في السكربت السابق)، فتُستبدل
  // بمعرّف تسلسلي عند الرفع مع إبقاء القراءة المحلية بالاسم الأصلي.
  let anonCounter = 0;
  function safeStorageName(fileName: string): string {
    if (/^[\x20-\x7E]+$/.test(fileName)) return fileName;
    const ext = fileName.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
    anonCounter++;
    return `asset-${anonCounter}${ext}`;
  }

  // رفع صورة محلية إلى bucket التخزين وإرجاع رابطها العام (idempotent: upsert).
  async function uploadImage(fileName: string): Promise<string> {
    const filePath = join(IMAGES_DIR, fileName);
    const bytes = readFileSync(filePath);
    const storagePath = `${STORAGE_PREFIX}/${safeStorageName(fileName)}`;
    const contentType = fileName.endsWith(".png")
      ? "image/png"
      : fileName.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    const { error } = await storage.storage.from(BUCKET).upload(storagePath, bytes, {
      contentType,
      upsert: true,
    });
    if (error) throw new Error(`فشل رفع ${fileName}: ${error.message}`);
    return storage.storage.from(BUCKET).getPublicUrl(storagePath).data.publicUrl;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL غير موجود في البيئة");
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();

  try {
    await client.query("begin");

    const logoUrl = menu.restaurant.logo_file ? await uploadImage(menu.restaurant.logo_file) : null;

    const restaurantRes = await client.query(
      `insert into public.restaurants (name_ar, name_en, logo_url) values ($1, $2, $3) returning id`,
      [menu.restaurant.name_ar, menu.restaurant.name_en, logoUrl]
    );
    const restaurantId: string = restaurantRes.rows[0].id;

    // slugify يطابق lib/actions/branch.actions.ts — الرابط العام لرموز QR يعتمد عليه.
    const branchSlug = "main-branch";
    const branchRes = await client.query(
      `insert into public.branches (restaurant_id, name_ar, name_en, slug) values ($1, $2, $3, $4) returning id`,
      [restaurantId, "الفرع الرئيسي", "Main Branch", branchSlug]
    );
    const branchId: string = branchRes.rows[0].id;

    const menuRes = await client.query(
      `insert into public.menus (branch_id, name_ar, name_en) values ($1, $2, $3) returning id`,
      [branchId, "المنيو الرئيسي", "Main Menu"]
    );
    const menuId: string = menuRes.rows[0].id;

    // ذاكرة تخزين مؤقت للمُسبِّبات (allergens مرجعية عامة، لا تتكرر باسم واحد).
    const allergenIdByNameAr = new Map<string, string>();

    let itemCount = 0;
    for (let ci = 0; ci < menu.categories.length; ci++) {
      const cat = menu.categories[ci];
      const catRes = await client.query(
        `insert into public.menu_categories (branch_id, menu_id, name_ar, name_en, sort_order)
         values ($1, $2, $3, $4, $5) returning id`,
        [branchId, menuId, cat.name_ar, cat.name_en, ci]
      );
      const categoryId: string = catRes.rows[0].id;

      for (let ii = 0; ii < cat.items.length; ii++) {
        const item = cat.items[ii];
        const imageUrl = item.image_file ? await uploadImage(item.image_file) : null;

        const itemRes = await client.query(
          `insert into public.menu_items
             (branch_id, name_ar, name_en, description_ar, description_en, price, calories, image_url, sort_order)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9) returning id`,
          [
            branchId,
            item.name_ar,
            item.name_en,
            item.description_ar || null,
            item.description_en || null,
            item.price,
            item.calories,
            imageUrl,
            ii,
          ]
        );
        const itemId: string = itemRes.rows[0].id;

        await client.query(
          `insert into public.menu_category_items (category_id, item_id, branch_id, sort_order)
           values ($1, $2, $3, $4)`,
          [categoryId, itemId, branchId, ii]
        );

        for (const allergen of item.allergens) {
          let allergenId = allergenIdByNameAr.get(allergen.name_ar);
          if (!allergenId) {
            const iconUrl = allergen.icon_file ? await uploadImage(allergen.icon_file) : null;
            const existing = await client.query(
              `select id from public.allergens where name_ar = $1 limit 1`,
              [allergen.name_ar]
            );
            if (existing.rows.length > 0) {
              allergenId = existing.rows[0].id;
            } else {
              const inserted = await client.query(
                `insert into public.allergens (name_ar, name_en, icon_url) values ($1, $2, $3) returning id`,
                [allergen.name_ar, allergen.name_en, iconUrl]
              );
              allergenId = inserted.rows[0].id;
            }
            allergenIdByNameAr.set(allergen.name_ar, allergenId!);
          }

          await client.query(
            `insert into public.item_allergens (item_id, allergen_id, branch_id) values ($1, $2, $3)
             on conflict do nothing`,
            [itemId, allergenId, branchId]
          );
        }

        itemCount++;
      }
    }

    await client.query("commit");
    console.log(
      `تم. restaurant=${restaurantId} branch=${branchId} menu=${menuId} — ${menu.categories.length} فئة، ${itemCount} صنف.`
    );
  } catch (err) {
    await client.query("rollback");
    throw err;
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error("فشل الاستيراد:", err);
  process.exit(1);
});
