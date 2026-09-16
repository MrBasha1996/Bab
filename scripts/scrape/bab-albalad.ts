// سكربت استخراج لمرة واحدة لبيانات المنيو من الموقع القديم
// https://bab-albalad.menus-sa.com، تحضيراً لاستيرادها لاحقاً في المرحلة 4
// (بعد بناء هجرة menu_catalog). لا يكتب لقاعدة البيانات إطلاقاً — فقط يُنتج
// data/import/bab-albalad/menu.json + صور محلية.
//
// تشغيل: npx tsx scripts/scrape/bab-albalad.ts

import { load, type CheerioAPI } from "cheerio";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE_URL = "https://bab-albalad.menus-sa.com";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const OUT_DIR = join(process.cwd(), "data", "import", "bab-albalad");
const IMAGES_DIR = join(OUT_DIR, "images");

// الموقع خلف Cloudflare/Laravel session، وتبديل اللغة (ar/en) مربوط بكوكي
// جلسة موجود مسبقاً: طلب /en بلا كوكيز يُعيد توجيه دائماً لـ/ar (تجاهل تام
// للمسار المطلوب)، ولا يعمل تبديل اللغة الفعلي إلا بعد إنشاء جلسة أولاً عبر
// زيارة الدومين الجذر. لذا نحتفظ بكوكي جلسة واحد مشترك بين كل الطلبات
// (session-scoped، وليس محلياً داخل كل استدعاء) ونزور الجذر مرة أولاً.
let sharedCookieJar = "";

async function fetchWithSession(url: string): Promise<string> {
  for (let hop = 0; hop < 15; hop++) {
    const res = await fetch(url, {
      redirect: "manual",
      headers: { "User-Agent": UA, Cookie: sharedCookieJar },
    });

    const setCookies = res.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      const jar = new Map(sharedCookieJar.split("; ").filter(Boolean).map((c) => {
        const [k, ...v] = c.split("=");
        return [k, v.join("=")] as const;
      }));
      for (const sc of setCookies) {
        const [pair] = sc.split(";");
        const [k, ...v] = pair.split("=");
        jar.set(k, v.join("="));
      }
      sharedCookieJar = Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
    }

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (!location) throw new Error(`Redirect بلا Location من ${url}`);
      url = new URL(location, url).toString();
      continue;
    }

    if (res.status !== 200) throw new Error(`فشل الطلب ${url}: ${res.status}`);
    return await res.text();
  }

  throw new Error(`تجاوز عدد إعادات التوجيه المسموح لـ ${url}`);
}

function directText($el: ReturnType<CheerioAPI>): string {
  return $el
    .contents()
    .filter((_, node) => node.type === "text")
    .text()
    .trim();
}

function parsePrice(text: string): number {
  const match = text.match(/[\d.]+/);
  if (!match) throw new Error(`تعذّر استخراج السعر من: "${text}"`);
  return parseFloat(match[0]);
}

function parseCalories(text: string): number | null {
  const match = text.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

interface RawAllergen {
  name: string;
  iconUrl: string | null;
}

interface RawItem {
  name: string;
  description: string;
  price: number;
  calories: number | null;
  imageUrl: string | null;
  imageAlt: string;
  allergens: RawAllergen[];
}

interface RawCategory {
  name: string;
  items: RawItem[];
}

interface RawPage {
  restaurantName: string;
  logoUrl: string | null;
  categories: RawCategory[];
}

function parsePage(html: string): RawPage {
  const $ = load(html);

  const restaurantName = $("h1").first().text().trim();
  const logoUrl = $(".logo img").first().attr("src") ?? null;

  const categories: RawCategory[] = [];
  $("div.product_category_data.slideup[id^='pop_cat_']").each((_, catEl) => {
    const $cat = $(catEl);
    const name = directText($cat.find(".category-group-name").first());

    const items: RawItem[] = [];
    $cat.find(".product_card").each((_, cardEl) => {
      const $card = $(cardEl);
      const $content = $card.find(".product_content");
      const itemName = $content.find("p.mb-0.mt-2").first().text().trim();
      const description = $content.find("p.description").first().text().replace(/\s+/g, " ").trim();
      const priceText = $content.find("p.product_price").first().clone().children("span").remove().end().text();
      const price = parsePrice(priceText);
      const caloriesText = $content
        .find("span")
        .filter((_, s) => /سعرات|calor/i.test($(s).text()))
        .first()
        .text();
      const calories = parseCalories(caloriesText);
      const imageUrl = $card.find(".product_image img").first().attr("src") ?? null;
      const imageAlt = $card.find(".product_image img").first().attr("alt") ?? "";

      const allergens: RawAllergen[] = [];
      $card.find(".allergen .single").each((_, aEl) => {
        const $a = $(aEl);
        allergens.push({
          name: $a.find(".popup-toolbar-title").first().text().trim(),
          iconUrl: $a.find("img").first().attr("src") ?? null,
        });
      });

      items.push({ name: itemName, description, price, calories, imageUrl, imageAlt, allergens });
    });

    categories.push({ name, items });
  });

  return { restaurantName, logoUrl, categories };
}

function slugFor(prefix: string, index: number, name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${prefix}-${String(index).padStart(2, "0")}${base ? "-" + base : ""}`;
}

async function downloadImage(url: string, fileName: string): Promise<string | null> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const ext = url.match(/\.(jpe?g|png|webp|gif)(?:\?|$)/i)?.[1]?.toLowerCase() ?? "jpg";
    const finalName = `${fileName}.${ext === "jpeg" ? "jpg" : ext}`;
    writeFileSync(join(IMAGES_DIR, finalName), buf);
    return finalName;
  } catch (err) {
    console.warn(`  تحذير: تعذّر تنزيل ${url}: ${(err as Error).message}`);
    return null;
  }
}

async function main() {
  mkdirSync(IMAGES_DIR, { recursive: true });

  console.log("إنشاء جلسة ...");
  await fetchWithSession(BASE_URL);
  console.log("جلب الصفحة العربية ...");
  const arHtml = await fetchWithSession(`${BASE_URL}/ar`);
  console.log("جلب الصفحة الإنجليزية ...");
  const enHtml = await fetchWithSession(`${BASE_URL}/en`);

  const ar = parsePage(arHtml);
  const en = parsePage(enHtml);

  if (ar.categories.length !== en.categories.length) {
    throw new Error(
      `عدد التصنيفات غير متطابق بين النسختين: ar=${ar.categories.length} en=${en.categories.length}`
    );
  }

  console.log(`اسم المطعم: ${ar.restaurantName} — ${ar.categories.length} تصنيف`);

  const logoFile = ar.logoUrl ? await downloadImage(ar.logoUrl, "logo") : null;

  const categoriesOut = [];
  for (let ci = 0; ci < ar.categories.length; ci++) {
    const arCat = ar.categories[ci];
    const enCat = en.categories[ci];

    if (arCat.items.length !== enCat.items.length) {
      throw new Error(
        `عدد الأصناف غير متطابق في تصنيف #${ci} ("${arCat.name}"): ar=${arCat.items.length} en=${enCat.items.length}`
      );
    }

    console.log(`  تصنيف: ${arCat.name} (${arCat.items.length} صنف)`);

    const itemsOut = [];
    for (let ii = 0; ii < arCat.items.length; ii++) {
      const arItem = arCat.items[ii];
      const enItem = enCat.items[ii];
      const baseSlug = slugFor(`c${ci}`, ii, enItem.name || arItem.name);

      const imageFile = arItem.imageUrl ? await downloadImage(arItem.imageUrl, `${baseSlug}-image`) : null;

      const allergensOut = [];
      for (let aIdx = 0; aIdx < arItem.allergens.length; aIdx++) {
        const arA = arItem.allergens[aIdx];
        const enA = enItem.allergens[aIdx];
        const iconFile = arA.iconUrl
          ? await downloadImage(arA.iconUrl, `allergen-${arA.name.replace(/\s+/g, "-").slice(0, 30)}`)
          : null;
        allergensOut.push({
          name_ar: arA.name,
          name_en: enA?.name ?? "",
          icon_file: iconFile,
        });
      }

      itemsOut.push({
        name_ar: arItem.name,
        name_en: enItem.name,
        description_ar: arItem.description,
        description_en: enItem.description,
        price: arItem.price,
        calories: arItem.calories,
        image_file: imageFile,
        allergens: allergensOut,
      });
    }

    categoriesOut.push({
      name_ar: arCat.name,
      name_en: enCat.name,
      items: itemsOut,
    });
  }

  const output = {
    source: `${BASE_URL}/ar`,
    scraped_at: new Date().toISOString(),
    restaurant: {
      name_ar: ar.restaurantName,
      name_en: "Bab Albalad",
      logo_file: logoFile,
    },
    categories: categoriesOut,
  };

  const outFile = join(OUT_DIR, "menu.json");
  writeFileSync(outFile, JSON.stringify(output, null, 2), "utf8");

  const totalItems = categoriesOut.reduce((n, c) => n + c.items.length, 0);
  console.log(`\nتم. ${categoriesOut.length} تصنيف، ${totalItems} صنف → ${outFile}`);
}

main().catch((err) => {
  console.error("فشل الاستخراج:", err);
  process.exit(1);
});
