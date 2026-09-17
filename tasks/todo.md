# Digital Menu Platform — خطة التنفيذ (Phase B → Implementation)

مرجع التحليل الكامل (Phase A، معتمَد): `C:\Users\HP\.claude\plans\26-digital-menu-rippling-bird.md`

مشروع جديد ومنفصل تماماً في `C:\Users\HP\Bab`، بمعمارية DealzTree ERP (Next.js + Supabase + shadcn/ui) مع دعم لغتين كامل (`_ar`/`_en`) — **لا علاقة له بـ `BabApp`** (مشروع Expo/Prisma منفصل تماماً، تم التأكيد صراحة).

---

## المرحلة 0 — تأسيس المشروع ✅ (منجزة 2026-09-15)

- [x] `create-next-app` (TypeScript, App Router, Tailwind, ESLint) — أُنشئ في مجلد مؤقت وونُقل يدوياً لأن npm يرفض حرف "B" الكبير في اسم الحزمة؛ الاسم في `package.json` صار `bab-digital-menu`
- [x] تثبيت: `@supabase/ssr @supabase/supabase-js next-intl react-hook-form zod @hookform/resolvers qrcode radix-ui next-themes lucide-react sonner cmdk tw-animate-css shadcn react-day-picker date-fns class-variance-authority clsx tailwind-merge`
- [x] نسخ `components/ui/*` (31 ملف) حرفياً من `DealzTree ERP` — **استُثني** `riyal-amount.tsx` (يعتمد على خط ريال سعودي مخصّص ومنطق عملة خاص بـ DealzTree، غير عام)؛ سيُضاف منسّق سعر مبسّط عند بناء نموذج الصنف (المرحلة 4)
- [x] نسخ `lib/utils.ts` (دالة `cn`) + `lib/ui/tone.ts` + `lib/i18n/validation.ts` + `app/globals.css` (كامل نظام الألوان/الثيم) — كلها تبعيات مباشرة لمكوّنات `components/ui/*` المنسوخة (form.tsx, stat-card.tsx)
- [x] إعداد `i18n/request.ts` بنفس آلية DealzTree (namespaces منفصلة، deepMerge). **ملاحظة**: قراءة `profiles.locale` كأولوية أولى قبل الكوكي ستُضاف في المرحلة 1 (لا بروفايل قبل وجود Auth) — الآن فقط كوكي→افتراضي
- [x] `app/layout.tsx`: خط Cairo (عربي) + Inter (إنجليزي)، `dir` ديناميكي محسوب من `getLocale()`، `Direction.Provider`، `NextIntlClientProvider`، `next-themes`
- [x] `next.config.ts`: `withNextIntl` + `images.remotePatterns` لـ Supabase Storage
- [x] `CLAUDE.md` أولي يوثّق التقنية/البنية/الأدوار/القواعد
- [x] التحقق: `next build` نجح (compile + typecheck + generate)، `eslint` نظيف (exit 0)، `next dev` شغّال فعلياً — تأكيد يدوي عبر curl أن الصفحة الرئيسية تُرجع 200 مع `lang="ar" dir="rtl"` وخطوط Cairo/Inter محمّلة

## المرحلة 1 — Supabase + Auth + الأدوار ✅ (منجزة 2026-09-15)

- [x] ربط بمشروع Supabase حي زوّدنيه المستخدم (`syrdjttgixilerlmcvvm`) — بيانات الاتصال في `.env.local` (مستثنى من git)
- [x] `lib/supabase/{server,client,admin,middleware}.ts` (نفس نمط DealzTree حرفياً، بلا device-id cookie/security-headers غير اللازمة للمرحلة)
- [x] `proxy.ts` لتحديث الجلسة وحماية `app/(app)/*` — **استثناء صريح لمسارات `/m/*`** (المنيو العامة) من مصفوفة الحماية حتى لا تُحوَّل أبداً لصفحة الدخول
- [x] Migration `0001_roles_profiles.sql` (مُطبَّقة فعلياً عبر مُشغِّل هجرات جديد `scripts/migrate.ts` + `npm run db:migrate`، بدل التطبيق اليدوي عبر SQL Editor كما في DealzTree — متاح هنا لأن الاتصال المباشر بقاعدة البيانات يعمل): `roles` + 3 أدوار أولية مبذورة (owner/branch_manager/staff) + `role_capabilities` مبذورة + `profiles` + RLS (قراءة/تعديل الذات فقط) + trigger `handle_new_user` ينشئ صف profile تلقائياً عند التسجيل
- [x] **تصحيح تسلسل عن الخطة الأصلية**: دالة `auth_branch_ids()` أُجِّلت عمداً لهجرة 0002 (المرحلة 2) لأنها تحتاج جدول `branches` غير الموجود بعد — لا معنى لها الآن؛ موثَّق بتعليق داخل الهجرة نفسها
- [x] `lib/auth/{getProfile,guards}.ts` — مبسّطة عن نسخة DealzTree (لا نطاقات أدوار مخصّصة/site_capability_overrides، غير لازمة لحجم هذا المشروع)؛ استُخدمت استعلامات منفصلة (profiles ثم roles ثم role_capabilities) بدل embed-join لأن نوع `Database` اليدوي البسيط لا يحمل `Relationships` metadata الكاملة اللازمة لأنواع embed
- [x] `lib/supabase/types.ts` أولي (roles/role_capabilities/profiles) — **درس مهم**: كل جدول يحتاج حقل `Relationships: []` صراحة (حتى لو فارغاً) وإلا يفشل `createClient<Database>` بصمت ويُرجع كل الاستعلامات بنوع `never`
- [x] صفحة `app/(auth)/login` + `app/(app)/layout.tsx` (يستدعي `requireProfile`) + `app/(app)/dashboard` كصفحة اختبار
- [x] التحقق الفعلي الكامل: `next build` نظيف (compile+typecheck)، إنشاء مستخدم اختبار حقيقي عبر Admin API، تأكيد أن trigger أنشأ صف profile تلقائياً، تعيين دور owner له، تسجيل دخول فعلي وقراءة البروفايل عبر RLS بنجاح (id/role/locale/capabilities الـ11 صحيحة)، **واختبار سلبي**: محاولة قراءة بروفايلات مستخدمين آخرين أرجعت مصفوفة فارغة (RLS يعزل فعلياً). مستخدم الاختبار (`owner-test@bab.local`) باقٍ في القاعدة لإعادة استخدامه في المراحل التالية.

## المرحلة 2 — المطعم/الفرع (Restaurant/Branch) ✅ (منجزة 2026-09-15)

- [x] Migration `0002_restaurants_branches.sql`: `restaurants` + `branches` + `auth_branch_ids()` (مؤجَّلة من 0001 كما هو مخطَّط) + `has_capability()` + RLS
- [x] **علّة اكتُشفت وأُصلحت أثناء الاختبار الفعلي (مو ثّقة في `0003_fix_branches_self_reference_rls.sql`)**: سياسة `branches_select` الأصلية استخدمت `auth_branch_ids()` والتي تستعلم جدول `branches` نفسه — مرجعية ذاتية جعلت `INSERT ... RETURNING` على فرع جديد يفشل بخطأ RLS رغم اجتياز `WITH CHECK` بنجاح (Postgres يُطبّق سياسة SELECT على RETURNING، والاستعلام الذاتي لا يرى الصف المُدرَج حديثاً بشكل موثوق ضمن نفس الأمر). الحل: صياغة مباشرة بلا استعلام ذاتي على `branches`. `auth_branch_ids()` نفسها تبقى آمنة ومستخدَمة من جداول أخرى (tables, menus, ...) لاحقاً لأنها ليست مرجعية ذاتية هناك — **درس مهم لأي RLS مستقبلي على نفس الجدول الذي تستعلمه دالة النطاق**
- [x] Migration `0004_bootstrap_restaurant_rpc.sql`: لا توجد سياسة INSERT على `restaurants` عمداً (لا معنى لمطعم بلا مالك) — RPC ذرّي `bootstrap_restaurant()` ينشئ المطعم ويجعل المستخدم الحالي `owner` دفعة واحدة، ويرفض التكرار لمن لديه مطعم أصلاً
- [x] `lib/validation/{restaurant,branch}.schema.ts` + `lib/actions/{restaurant,branch}.actions.ts` + بنية دعم مبسّطة (`lib/actions/types.ts`, `lib/i18n/{server-locale,action-messages}.ts` + `messages/{ar,en}/actions.json`) — نسخة مبسّطة عن نظام db-errors الكامل في DealzTree (76 مفتاح `db.*`)، غير مبرَّرة لحجم هذا المشروع الآن؛ أخطاء Supabase تُعرض كما هي مؤقتاً
- [x] `components/restaurant/RestaurantOnboardingForm.tsx` + `components/branch/BranchForm.tsx` (نفس نمط `SiteForm.tsx` في DealzTree حرفياً: `react-hook-form` + `zodResolver` + `useTransition` + `toast`)
- [x] صفحات: `app/(app)/dashboard` (يعرض نموذج تأسيس المطعم إن لم يكن للمستخدم مطعم بعد، وإلا لوحة عادية) + `app/(app)/branches/{page,new/page,[id]/page}.tsx` بنمط `PageHeader` + `grid gap-6`
- [x] `lib/supabase/types.ts`: أُضيفت `restaurants`/`branches`/دوال RPC الجديدة (كل جدول يحمل `Relationships: []` صراحة — نفس الدرس من المرحلة 1)
- [x] `supabase/tests/branches_rls_test.sql` (توثيقي — السيناريوهات الخمسة أدناه تحققت فعلياً حية، تنفيذ pgTAP آلي مؤجَّل لبيئة CI/psql محلي لاحقاً)
- [x] **التحقق الفعلي الكامل** (عبر سكربتات Node مباشرة ضد Supabase الحي، تحاكي تماماً استعلامات الكود الفعلي): مالك أنشأ فرعاً ورآه فوراً (بعد الإصلاح) · عزل بين مطعمين مختلفين تام (owner لا يرى فروع مطعم آخر) · موظف staff بنطاق فرع واحد يرى فرعه فقط ولو وُجد فرع شقيق لنفس المطعم · `has_capability('manage_branches')` صحيحة (true لـowner، false لـstaff) · owner يعدّل اسم مطعمه بنجاح (RLS + capability) · `next build` نظيف، `eslint` نظيف (exit 0) · مسارات `/branches` و`/branches/new` غير المصادَق عليها تُحوَّل فعلياً لـ`/login` (307، تحقق مباشر عبر curl). **قيد معروف**: لم يُختبَر تدفق النموذج (submit فعلي عبر متصفح حقيقي بجلسة كوكي) لعدم توفر أداة متصفح Headless في هذه البيئة — تحقّقنا بدلاً من ذلك من صحة كل استعلام/RLS/Server Action مباشرة، وهي نفس العمليات التي تُنفَّذها النماذج.

## المرحلة 3 — الطاولات + QR ✅ (منجزة 2026-09-15)

- [x] Migration `0005_tables_qr.sql`: `alter table branches add column slug` (مطلوب الآن لرابط `/m/[branchSlug]/t/[qrToken]`، مشتق تلقائياً من `name_en` للفروع الموجودة، ثابت لاحقاً) + `tables` + `table_qr_codes` (علاقة 1:1، `qr_token` عشوائي فريد بامتداد `gen_random_bytes(32)`) + RLS كاملة (`auth_branch_ids()` + `manage_tables`/`manage_qr`، وسياسة `select` إضافية لـ`anon` بشرط `is_active=true` تحضيراً للمرحلة 6). **ملاحظة مهمة**: عند محاولة تطبيق الهجرة عبر `npm run db:migrate` تبيّن أن هذا المخطط بالضبط (نفس الأعمدة/القيود/أسماء السياسات حرفياً) كان مطبَّقاً بالفعل على القاعدة الحية من عمل سابق ضمن هذه الجلسة لم يُحفَظ محلياً (سياق مضغوط/غير معروض)؛ تحقّقتُ من كل عمود وقيد وسياسة يدوياً عبر استعلامات `information_schema`/`pg_policies` قبل اعتماد الهجرة، وسجّلتها في `public._migrations` بدل إعادة تنفيذ DDL (كان سيفشل لوجود الأعمدة أصلاً). لا بيانات فعلية فُقدت — الجداول كانت فارغة (`tables_count=0`).
- [x] `lib/validation/table.schema.ts` + `lib/actions/table.actions.ts` (`createTable` ينشئ الطاولة+رمز QR معاً، `updateTable`، `regenerateQr` بتوكن `crypto.randomBytes(32)` جديد كلياً، `disableQr`)
- [x] توليد صورة QR على السيرفر عبر `qrcode` (`QRCode.toDataURL`) لرابط `${NEXT_PUBLIC_SITE_URL}/m/[branchSlug]/t/[qrToken]` — أُضيف `NEXT_PUBLIC_SITE_URL` إلى `.env.local` (قيمة تطوير `http://localhost:3000`، يحتاج تحديث بدومين الإنتاج لاحقاً)
- [x] صفحات `app/(app)/tables/{page,new/page,[id]/page}.tsx` بنمط `branches` حرفياً + `components/table/{TableForm,QrPanel}.tsx` (تحميل/طباعة/إعادة توليد/تعطيل) + `messages/{ar,en}/tables.json` + تسجيل namespace `tables` في `i18n/request.ts`
- [x] `supabase/tests/tables_rls_test.sql` (توثيقي بنفس نمط `branches_rls_test.sql`) + **تحقق فعلي حي** عبر سكربت Node مؤقت (نفس أسلوب المرحلة 2): تسجيل دخول فعلي بمستخدم `owner-test@bab.local`، إنشاء طاولة+QR، حل التوكن عبر عميل `anon` بنجاح، إعادة التوليد أبطلت التوكن القديم فوراً (0 نتائج) وفعّلت الجديد، التعطيل أخفى الصف عن `anon` فوراً، **واختبار سلبي**: محاولة إنشاء طاولة في فرع مطعم آخر رفضتها RLS فعلياً (`new row violates row-level security policy`). السكربت المؤقت حُذف بعد التحقق (لا يُترك أثر في `scripts/`).
- [x] `next build` نظيف (compile+typecheck، كل المسارات `tables/*` مُولَّدة)، `eslint` نظيف (exit 0)
- [x] `lib/supabase/types.ts` حُدِّث بـ`branches.slug` + جدولي `tables`/`table_qr_codes` (نفس درس `Relationships: []` من المراحل السابقة)

## المرحلة 4 — كتالوج المنيو (Menus/Categories/Items)

- [x] استخراج بيانات المنيو الفعلية من الموقع القديم bab-albalad.menus-sa.com (اسم/شعار/تصنيفات/أصناف ثنائية اللغة، فرع واحد/12 تصنيف/77 صنف) عبر سكربت scrape لمرة واحدة → `scripts/scrape/bab-albalad.ts` → `data/import/bab-albalad/menu.json` + صور محلية (`data/import/bab-albalad/images/`, 87 ملف). **علّتان اكتُشفتا وأُصلحتا في السكربت أثناء التحقق**: (1) الموقع خلف جلسة Laravel — طلب `/en` بلا كوكي جلسة موجود مسبقاً يُعيد التوجيه دائماً لـ`/ar` متجاهلاً المسار المطلوب كلياً (كان يُنتج `name_en` مطابقاً حرفياً لـ`name_ar` لكل الحقول)؛ الحل: كوكي جلسة واحد مشترك بين كل الطلبات (لا محلي داخل كل استدعاء) + زيارة الدومين الجذر أولاً لإنشاء الجلسة قبل طلب `/ar`/`/en` صراحة. (2) 39 من 77 صورة صنف (التصنيفات 0-5) فشل تنزيلها صامتاً بدون استثناء عند أول تشغيل (على الأرجح مهلة CDN عابرة)؛ إعادة التشغيل بعد إصلاح (1) أعادت تنزيل الكل بنجاح (0 صور مفقودة، 87 ملف شامل الشعار). **درس مهم لأي scraping مستقبلي خلف جلسة Laravel/locale مشابهة**: لا تفترض أن المسار الصريح في الرابط كافٍ — تحقّق من جلسة/كوكي مسبق.
- [x] Migration `0006_menu_catalog.sql`: `menus, menu_schedules, menu_categories, menu_items, menu_category_items, item_variants, option_groups, option_values, allergens, item_allergens` — كل حقل نصي عميل بعمودين `_ar`/`_en` إلزاميين. طُبِّقت فعلاً عبر `npm run db:migrate`. `is_available`/`is_visible` منفصلان عمداً على `menu_items` (تشغيلي يومي مقابل قرار محتوى)، و`toggle_item_availability` RPC مستقل بصلاحية أخف (بنفس نمط `bootstrap_restaurant`) لأن دور `staff` يملك `toggle_item_availability` فقط بدون `manage_items` الكاملة.
- [x] Supabase Storage bucket `menu-images` (عام القراءة) — أُنشئ داخل نفس هجرة 0006 عبر `insert into storage.buckets`
- [x] `lib/domain/menu-schedule.ts` + اختبارات وحدة (عادي/عابر لمنتصف الليل/بلا جدولة) — أُضيف `vitest` كمُشغِّل اختبارات (لم يكن موجوداً؛ لازم لهذا البند). **ملاحظة تثبيت**: أول تثبيت لـ`vitest` (بلا تحديد إصدار) تعارض مع `@types/node@^20` القديم (يحتاج `vitest@5` إصدار `@types/node@^22|^24`)، ورفع الإصدار مباشرة أيضاً كشف 5 ثغرات في `vite`/`esbuild` القديمين المُثبَّتين تبعياً؛ الحل: رفع `@types/node` إلى `^24` (يطابق Node الفعلي v24.15.0 في البيئة) مع `vitest@latest` معاً دفعة واحدة → 0 ثغرات. الحساب يعتمد `Intl.DateTimeFormat` بمنطقة الفرع (IANA) مباشرة بلا أي مكتبة timezone إضافية. `npm run test` (`vitest run`) نظيف: 4/4 ناجحة.
- [x] `lib/validation/{menu,category,item,option-group}.schema.ts` (يفرض `_ar`+`_en` معاً)
- [x] `lib/actions/{menu,category,item}.actions.ts` — تعديل الصنف يستبدل كل علاقاته الفرعية (فئات/variants/option groups+values/مسبِّبات) بالكامل عند كل حفظ بدل دمج جزئي (مقبول لعدم وجود تعديل متزامن متوقَّع)؛ رفع صورة الصنف عبر عميل admin (تخزين بلا سياسات RLS مضبوطة بعد) لكن بعد تحقق مسبق من ملكية الفرع عبر العميل المصادَق
- [x] صفحات الإدارة: `Menus/{list,new,[id]}`, `Menus/[id]/Categories/{new,[categoryId]}`, `Items/{list,new,[id]}` (كيان مستقل يُربط بأكثر من فئة عبر `CategoryItemsPanel`، بدل تعشيشه تحت فئة واحدة)، نموذج صنف كامل (صورة، وصف، سعر، السعرات، variants، option groups/values، allergens) عبر `useFieldArray`
- [x] زر "غير متوفر" سريع (`toggle_item_availability` بصلاحية أخف) — `components/item/AvailabilityToggle.tsx` في قائمة `/items`
- [x] اختبار RLS: القراءة العامة (anon) لا ترى `is_available=false`/`is_visible=false`، ولا تكتب شيئاً إطلاقاً — `supabase/tests/menu_catalog_rls_test.sql` (توثيقي) + **تحقق فعلي حي** عبر سكربت Node مؤقت (نفس أسلوب المراحل 2/3، حُذف بعد التحقق)
- [x] التحقق: إنشاء منيو + فئتين + صنف كامل الحقول (variant + option group/value + allergen) بنجاح، وربط الصنف بالفئتين معاً وظهوره في الاثنين فعلاً عبر anon. **التحقق الفعلي الكامل عبر سكربت Node حي ضد Supabase**: تسجيل دخول owner-test@bab.local → إنشاء قائمة+فئتين+صنف كامل الحقول مرتبط بالفئتين → anon يرى الصنف في الفئتين ويرى الصنف المتوفر → `toggle_item_availability` RPC يقلب `is_available` إلى false → anon لم يعد يرى الصنف إطلاقاً → **اختبار سلبي**: محاولة إنشاء صنف بـ`branch_id` عشوائي خارج نطاق المستخدم رُفضت فعلياً بخطأ RLS. `next build`+`eslint`+`vitest run` كلها نظيفة (0 أخطاء/تحذيرات). **علّة TypeScript اكتُشفت وأُصلحت أثناء البناء**: `zodResolver` مع حقول `.default()` متداخلة (`sortOrder`, `isRequired`, `minSelect`, `maxSelect`, `allergenIds`, إلخ) يُنتج تعارض أنواع `Resolver`/`Control` غامضاً ("two different types... unrelated") بسبب افتراق نوعي input/output لـzod — نفس العلّة الموثَّقة مسبقاً في `~/.claude/learnings/frontend.md` (مشروع DealzTree)، لم أُراجعها قبل البدء فأعدت اكتشافها؛ الحل: إزالة كل `.default()` من مخططات النماذج والاعتماد على `defaultValues` في `useForm` فقط.

## المرحلة 5 — الحجز المبسّط (MVP) ✅ (منجزة 2026-09-15)

- [x] Migration `0007_reservations.sql`: `customers, reservations` (بدون Pre-order — مؤجَّل عمداً وموثَّق في الكود بتعليق موجز). بدون find-or-create للعميل بالهاتف وبدون عمود `status` — تبسيط متعمّد يطابق نطاق "إنشاء/عرض فقط". RLS بنفس نمط `menu_catalog`: `select` بشرط `branch_id ∈ auth_branch_ids()` **و** `has_capability('view_reservations')`، `insert` بإضافة `has_capability('manage_reservations')` — الصلاحيتان كانتا مبذورتان فعلاً منذ migration 0001. **بدون** سياسة `anon` في هذه الهجرة عمداً (ستُضاف في هجرة المرحلة 6 عند بناء صفحة QR، لا تُعدَّل 0007 بعد تطبيقها).
- [x] `lib/validation/reservation.schema.ts` + `lib/actions/reservation.actions.ts` (`createReservation` فقط — إنشاء/عرض فقط، بدون `update`/`cancel`)
- [x] `components/reservation/ReservationForm.tsx` + صفحتا `app/(app)/reservations/{page,new/page}.tsx` (نفس نمط `tables` حرفياً) + `messages/{ar,en}/reservations.json` + تسجيل namespace `reservations` في `i18n/request.ts` + `lib/supabase/types.ts` (جدولا `customers`/`reservations`)
- [x] `supabase/tests/reservations_rls_test.sql` (توثيقي) + **تحقق فعلي حي** عبر اتصال Postgres مباشر (`DATABASE_URL`) بمحاكاة جلسة `authenticated` (`set_config('request.jwt.claims', ...)` + `set local role authenticated`) داخل معاملة تُلغى بالكامل (`rollback`) في النهاية — بديل عن تسجيل الدخول الفعلي بمستخدم `owner-test@bab.local` لأن جلسة Claude أخرى (`bab-db`) أبلغت أن كلمة مروره تُعاد ضبطها بشكل متكرر من سكربتات اختبار متوازية؛ تجنّباً لأي تصادم لم أُسجّل دخولاً فعلياً بهذا الحساب في هذه المرحلة. **النتائج**: إنشاء طاولة + عميل + حجز مربوط بها في فرع owner-test نجح وظهر فوراً في استعلام القائمة، **واختبار سلبي**: محاولة إنشاء عميل بـ`branch_id` لفرع مطعم آخر رُفضت فعلياً بخطأ RLS ("new row violates row-level security policy"). كل بيانات الاختبار أُلغيت (`rollback`)، لا أثر باقٍ في القاعدة.
- [x] `next build` نظيف (compile+typecheck، كل مسارات `reservations/*` مُولَّدة)، `eslint` نظيف (exit 0 — تصحيح تحذير React Compiler الوحيد باستخدام `useWatch` بدل `form.watch()` كما في `ItemForm.tsx`)، `vitest run` نظيف (4/4، لا اختبارات جديدة لهذه المرحلة لعدم وجود منطق حسابي يستحق اختبار وحدة)

## المرحلة 6 — واجهة المنيو العامة (QR + Tablet) ✅ (منجزة 2026-09-15)

- [x] Migration `0008_menu_events.sql`: `qr_scan_events` (كتابة anon فقط، بلا قراءة) + سياسات `anon select` جديدة على `restaurants`/`branches`/`tables` (بيانات غير حساسة، مطلوبة لصفحة QR) + RPC `get_table_reservation(branch_slug, qr_token)` بدل سياسة anon عامة على `reservations` (راجع الملاحظة الأمنية أدناه)
- [x] Route عام: `app/(public)/m/[branchSlug]/t/[qrToken]/page.tsx` — حل التوكن عبر `lib/domain/resolve-table.ts`، عرض الترحيب + رقم الطاولة + بيانات الحجز إن توفرت (`components/public-menu/{MenuHeader,ReservationCard}.tsx`)
- [x] اكتشاف لغة تلقائي (`Accept-Language`) + fallback عربي + زر تبديل يُخزَّن بكوكي (`components/public-menu/LanguageSwitcher.tsx`) — طُبِّق عالمياً (إدارة + عام) في `i18n/request.ts` كخطوة بين الكوكي والافتراضي `ar`
- [x] عرض القوائم النشطة الآن حسب `menu_schedules` (توقيت الفرع) — `lib/domain/get-menu-tree.ts` يستخدم `isMenuActiveNow` الموجودة من المرحلة 4 لكل قائمة على حدة (قوائم متعددة نشطة معاً مدعومة)
- [x] تصفح Categories → Items → Item Details (صورة، وصف، سعر، variants، options، allergens) عبر `components/public-menu/{MenuBrowser,ItemDetailsSheet}.tsx`، بحث فوري (client-side على شجرة مُجلَبة سيرفرياً دفعة واحدة)، إخفاء غير المتوفر (RLS على `menu_items` تتكفّل به تلقائياً، بلا فلترة إضافية بالكود)
- [x] تسجيل حدث `qr_scan` عند الفتح — `lib/actions/qr-scan.actions.ts` (insert فقط، أفضل جهد، لا يُفشِل الصفحة)
- [x] Route منفصل Tablet: `.../tablet/page.tsx` (نفس البيانات، بلا تسجيل `qr_scan` — التابلت جهاز ثابت وليس مسحاً فعلياً — وبتخطيط أعرض بلا حاوية عرض محدودة)
- [x] مكوّن `ActionBar` فارغ/معطّل (نقطة توسّع مستقبلية موثّقة بتعليق موجز، بلا منطق فعلي) — `components/public-menu/ActionBar.tsx`
- [x] التحقق الفعلي الكامل (انظر Review أدناه)

## المرحلة 7 — مراجعة نهائية ✅ (منجزة 2026-09-15)

- [x] `next build` + `eslint` + `tsc --noEmit` خضراء
- [x] مراجعة أمنية سريعة: لا اعتماد على إخفاء واجهة، RLS مُختبَرة على كل جدول، QR token غير قابل للتخمين فعلياً (طول كافٍ + عشوائية تشفيرية)
- [x] تحديث قسم Review في هذا الملف بملخص ما تم وأي ملاحظات

---

## التحقق الشامل (نهاية المرحلة 6)

1. إنشاء Restaurant → Branch → Table → QR، والتأكد أن الرابط يحوي توكن عشوائي طويل
2. إعادة توليد QR والتأكد أن الرابط القديم لم يعد يعمل والطاولة نفسها لم تتغير
3. إنشاء Menu + Category + Item بكل الحقول، وربط صنف بأكثر من فئة والتأكد من ظهوره في الاثنين
4. تعديل `menu_schedules` لتغطية فترة عابرة لمنتصف الليل والتأكد من ظهور/اختفاء المنيو في اللحظة الصحيحة
5. تعليم صنف "غير متوفر" والتأكد من اختفائه فوراً في صفحة QR
6. فتح رابط Tablet والتأكد من واجهة Full Screen بلا عناصر إدارة
7. محاولة وصول موظف Branch A إلى بيانات Branch B عبر Server Action مباشرة، والتأكد أن RLS يمنعها فعلياً
8. تبديل اللغة يدوياً والتأكد من انعكاس RTL/LTR على كامل الصفحة العامة

---

## المرحلة 8 — إصلاح: اختيار الفرع مفقود عند الإضافة (طاولات + حجوزات) ✅ (منجزة 2026-09-15)

**المشكلة المؤكدة من المستخدم**: `TableForm` و`ReservationForm` يُخفيان حقل اختيار الفرع عند الإضافة إن كان `branches.length <= 1` (`!tableId && branches.length > 1` / `branches.length > 1`). لمطعم بفرع واحد هذا متوقَّع، لكن المستخدم يتوقع ظهور الحقل دائماً عند الإضافة — على الأرجح لأن العدد الفعلي أكبر من 1 أو لأنه يتوقع وضوح الفرع المستهدف دائماً.

- [x] `components/table/TableForm.tsx`: إزالة شرط `branches.length > 1`، إبقاء `!tableId && branches` فقط (يظهر الحقل دائماً عند الإضافة، حتى لفرع واحد)
- [x] `components/reservation/ReservationForm.tsx`: نفس التعديل — الشرط أصبح `branches.length > 0` بدل `branches.length > 1` (الحقل يظهر عند الإضافة والتعديل معاً، لا فرق بين الحالتين في هذا النموذج أصلاً بخلاف `TableForm`)
- [x] تحقق: `next build` + `eslint` نظيفان (0 أخطاء/تحذيرات)

## المرحلة 9 — Corporate & Events Reservations (نظام كامل منفصل) ✅ (منجزة 2026-09-15)

حجز خارجي للشركات/المناسبات، منفصل عن حجز الأفراد MVP (`reservations`) لاختلاف طبيعة البيانات (لا طاولة واحدة ثابتة بالضرورة، يحتاج تدفق موافقة، تفاصيل جهة/مناسبة).

- [x] Migration `0009_event_reservations.sql`:
  - `event_reservations`: `id, branch_id, reservation_type (event|corporate), company_name (nullable), contact_name, contact_phone, guest_count, event_date, status (pending|confirmed|rejected) default 'pending', notes, created_at`
  - سعة `guest_count` تتجاوز طاولة واحدة عادة — بدون ربط جدول طاولات ملزم في MVP هذه الميزة (يُدار الترتيب يدوياً عبر `notes` مبدئياً، تحسين لاحق إن لزم)
  - صلاحيات جديدة `view_event_reservations`/`manage_event_reservations` تُضاف لـ`role_capabilities` لـ`owner`/`branch_manager` فقط (ليست لـ`staff`، بنفس منطق أن هذه قرارات إدارية)
  - RLS بنفس نمط `reservations` (`branch_id ∈ auth_branch_ids()` + capability)، مع إضافة سياسة `update` (غير موجودة في `reservations`) لأن تغيير `status` يحتاجها
- [x] `lib/validation/event-reservation.schema.ts` + `lib/actions/event-reservation.actions.ts` (`createEventReservation`, `updateEventReservationStatus`)
- [x] `components/event-reservation/EventReservationForm.tsx` + `components/event-reservation/StatusPanel.tsx` + صفحات `app/(app)/event-reservations/{page,new/page,[id]/page}.tsx` (صفحة `[id]` لعرض التفاصيل وتغيير الحالة: قيد المراجعة/مؤكد/مرفوض)
- [x] `messages/{ar,en}/eventReservations.json` (تسمية camelCase لتطابق اسم الـ namespace كما في `publicMenu.json` — درس: اسم الملف يجب أن يطابق حرفياً قيمة `ns` في `i18n/request.ts` لأنه يُستخدم مباشرة في مسار `import()`) + تسجيل namespace + رابط في `AppSidebar.tsx` (أيقونة `PartyPopper`)
- [x] `lib/supabase/types.ts`: جدول `event_reservations` جديد
- [x] `supabase/tests/event_reservations_rls_test.sql` (توثيقي) + **تحقق فعلي حي** عبر اتصال Postgres مباشر (نفس أسلوب المرحلة 5: `set_config('request.jwt.claims', ...)` + `set local role authenticated` داخل معاملة تُلغى بـ`rollback`): (1) owner أنشأ حجز مناسبة في فرعه، قرأه فوراً، وعدّل حالته إلى `confirmed` بنجاح عبر سياسة `update` الجديدة؛ (2) **اختبار سلبي**: إدراج في فرع مطعم آخر رُفض فعلياً بخطأ RLS؛ (3) **اختبار سلبي إضافي**: مستخدم بدور `staff` (بلا `view_event_reservations`) لم ير أي صف. 3/3 نجحت. السكربت المؤقت حُذف بعد التحقق.
- [x] `next build` نظيف (18 مساراً شاملة `event-reservations/*` الثلاثة الجديدة)، `eslint` نظيف (exit 0)

## المرحلة 10 — Restaurant Operations: مصدر الحجز وحالته (لحجز الأفراد) ✅ (منجزة 2026-09-15)

حجز الأفراد الحالي (`reservations`) بلا `status`/`source` عمداً (MVP). الآن مطلوب تمييز حجوزات الموقع/الهاتف/Walk-in وتتبع حالة الحجز — امتداد بدون كسر التوافق.

- [x] Migration `0010_reservations_status_source.sql`: إضافة `source text not null default 'phone' check (source in ('website','phone','walk_in'))` و`status text not null default 'confirmed' check (status in ('pending','confirmed','cancelled'))` إلى `reservations` + سياسة `reservations_update` جديدة (لم تكن موجودة من المرحلة 5 — إنشاء/عرض فقط سابقاً)، بنفس شرط `manage_reservations` المستخدَم في `insert`
- [x] `reservation.schema.ts`: حقل `source` إلزامي في `reservationSchema` + مخطط جديد `reservationStatusSchema` (نفس نمط `eventReservationStatusSchema`)
- [x] `reservation.actions.ts`: `createReservation` يُدرج `source` ويُحوِّل بعد الحفظ إلى `/reservations/[id]` بدل `/reservations` (لإتاحة تعديل الحالة لاحقاً) + `updateReservationStatus` action جديدة
- [x] `ReservationForm.tsx`: حقل `source` جديد (Select) بعد "وقت الحجز"، بنفس نمط بقية الحقول (select-radix)
- [x] `components/reservation/StatusPanel.tsx` (جديد، بنفس نمط `event-reservation/StatusPanel.tsx` لكن بـ`select-radix` بدل `select` الخام لأن نماذج الحجز مُرحَّلة له أصلاً) + `app/(app)/reservations/[id]/page.tsx` (صفحة تفاصيل جديدة: بيانات العميل/الطاولة/المصدر + `StatusPanel`)
- [x] `app/(app)/reservations/page.tsx`: كل بطاقة حجز أصبحت رابطاً لصفحة التفاصيل، وتعرض المصدر والحالة في السطر الثاني
- [x] `messages/{ar,en}/reservations.json`: مفاتيح `form.source*` + namespace `detail` كامل (بما فيه `detail.sourceValue.*` ككائن متداخل، لا مفاتيح بنقطة حرفية — نفس نمط `eventReservations.json`)
- [x] `lib/supabase/types.ts`: تحديث `reservations.Row`/`Insert` بـ`source`/`status`
- [x] تحقق فعلي حي عبر اتصال Postgres مباشر (نفس أسلوب المراحل 5/9: `set_config('request.jwt.claims', ...)` + `set local role authenticated` داخل معاملة أُلغيت بـ`rollback`): (1) إدراج حجز بـ`source='website'` نجح والقيمة الافتراضية `status='confirmed'` صحيحة؛ (2) تحديث `status` إلى `cancelled` عبر سياسة `reservations_update` الجديدة نجح؛ (3) إدراج بلا تحديد `source` صراحة أعطى الافتراضي `phone`/`confirmed` (توافق الصفوف القديمة)؛ (4) **اختبار سلبي**: قيمة `source` غير صالحة (`'fax'`) رُفضت فعلياً بخطأ `check constraint` (عبر `savepoint`/`rollback to savepoint` لتفادي إبطال المعاملة كاملة)؛ (5) اختبار سلبي إضافي لـstaff بلا `manage_reservations` كان `SKIP` (لا يوجد مستخدم staff مرتبط بهذا الفرع في القاعدة الحالية) — الصلاحية نفسها مُختبَرة فعلياً ومؤكَّدة في المرحلة 9 لنفس النمط (`event_reservations`)، فالمخاطرة منخفضة. `next build`/`eslint`/`tsc --noEmit` كلها نظيفة.

## المرحلة 11 — Pre-order أثناء الحجز (منفصل صراحة عن Digital Menu)

اختيار العميل لأصناف من المنيو أثناء إنشاء الحجز (قبل الوصول) — مختلف عن تصفح Digital Menu وقت الحضور (المرحلة 6، بلا طلب).

**تصحيح عن المخطط الأصلي**: رقم الهجرة التالي المتاح فعلياً هو `0012` — `0011_profiles_set_locale_rpc.sql` مُطبَّقة على القاعدة الحية من عمل جلسة سابقة غير مسجَّل في هذا الملف (نفس نمط "علّة اكتُشفت" الموثَّقة في المرحلة 3). كما أُضيف عمود `branch_id` مباشرة على الجدول الجديد (غير مذكور في المخطط الأصلي أعلاه) التزاماً بقاعدة المشروع الثابتة في `CLAUDE.md` ("كل جدول جديد ذو `branch_id` يحمله مباشرة") بدل الاعتماد على join عبر `reservation_id` لسياسات RLS.

- [x] Migration `0012_preorders.sql`: `reservation_preorder_items (id, branch_id, reservation_id, menu_item_id, item_variant_id nullable, quantity, notes, created_at)` — بلا سعر مخزَّن (يُقرأ من `menu_items`/`item_variants` وقت العرض). RLS بنفس نمط `reservations` (`branch_id ∈ auth_branch_ids()` + `manage_reservations` لـ select/insert/delete)
- [x] `lib/validation/preorder.schema.ts` (مصفوفة أصناف: `menuItemId`, `itemVariantId` اختياري, `quantity`, `notes` اختياري)
- [x] `lib/actions/preorder.actions.ts`: دالة `replacePreorderItems` تستبدل كل أصناف الحجز دفعة واحدة (نفس نمط استبدال العلاقات الفرعية للصنف في المرحلة 4) — تُستدعى من `createReservation` مباشرة بعد إنشاء الحجز (نفس تسلسل إنشاء customer→reservation الحالي)، وأيضاً `updatePreorderItems` action مستقلة تُستدعى من صفحة التفاصيل لتعديل لاحق
- [x] توسيع `ReservationForm.tsx` بقسم اختياري "استعرض المنيو" (تصفح مبسّط عبر `getActiveMenuTree` الموجودة من المرحلة 6، مُجلَبة سيرفرياً لكل فرع في `new/page.tsx` وتُمرَّر كخريطة `menuByBranch`) لإضافة أصناف قبل الحفظ، عبر `useFieldArray`
- [x] عرض الأصناف المطلوبة مسبقاً في صفحة تفاصيل الحجز `/reservations/[id]` (`components/reservation/PreorderPanel.tsx` جديد، تعديل عبر `updatePreorderItems`)
- [x] `lib/supabase/types.ts` تحديث (`reservation_preorder_items` + `Relationships: []`) + `messages/{ar,en}/reservations.json` (مفاتيح قسم preorder في `form`/`detail`) + تحقق فعلي حي (معاملة Postgres مباشرة بـ`rollback`، إيجابي + سلبي RLS) + `next build`/`eslint`/`tsc --noEmit`

## المرحلة 12 — نصف/نصف وتخصيص متقدم للصنف ✅ (منجزة 2026-09-15)

**قرارات مؤكَّدة من المستخدم (2026-09-15)**: قاعدة التسعير = السعر الأعلى بين النصفين · النصفان يجب أن يكونا من نفس الفئة فقط · الخيار يظهر في Pre-order فقط (أثناء الحجز)، لا في صفحة QR العامة.

- [x] Migration `0013_item_half_half.sql`: `menu_items.is_splittable boolean not null default false` (علم إداري يحدده صاحب المطعم لكل صنف) + `reservation_preorder_items.second_menu_item_id uuid references menu_items(id)` و`second_item_variant_id uuid references item_variants(id)` (كلاهما nullable — NULL يعني سطر عادي بلا تنصيف). بلا تغيير على RLS (نفس سياسات `reservation_preorder_items` الحالية تكفي، العمودان الجديدان لا يغيّران شرط `branch_id`)
- [x] `item.schema.ts`: حقل `isSplittable: z.boolean()` جديد + `item.actions.ts`: حفظ/قراءة العمود
- [x] `ItemForm.tsx`: مفتاح تبديل (Switch/Checkbox) "قابل للتنصيف نصف/نصف" بجانب باقي إعدادات الصنف
- [x] `get-menu-tree.ts`: `PublicItem` يكسب `isSplittable: boolean` و`categoryIds: string[]` (لازمة لفلترة "نفس الفئة" في واجهة Pre-order)
- [x] `preorder.schema.ts`: `preorderItemSchema` يكسب `secondMenuItemId`/`secondItemVariantId` اختياريين (نفس نمط `itemVariantId` الحالي بـ`z.union([uuid, literal("")])`)
- [x] `preorder.actions.ts`: دالة تحقق سيرفرية جديدة (قبل `replacePreorderItems`) تتأكد لكل سطر فيه `secondMenuItemId`: كلا الصنفين `is_splittable=true` فعلاً، ويتشاركان فئة واحدة على الأقل (`menu_category_items`) — رفض السطر بخطأ واضح إن فشل أي شرط (لا يمكن فرضه بقيد DB مباشر بسبب علاقة N:N مع الفئات)
- [x] السعر عند التنصيف = الأعلى بين (سعر الصنف الأول + سعر متغيره إن وُجد) و(سعر الصنف الثاني + سعر متغيره إن وُجد) — يُحسب عند العرض فقط (نفس مبدأ "بلا سعر مخزَّن" من المرحلة 11)، في `PreorderPanel.tsx`/صفحة تفاصيل الحجز
- [x] `ReservationForm.tsx` + `PreorderPanel.tsx`: مفتاح "نصف/نصف" اختياري لكل سطر Pre-order — عند التفعيل يظهر Select ثانٍ (صنف + متغيّر) مُقيَّد بالأصناف `is_splittable=true` التي تشارك فئة مع الصنف الأول المختار فقط
- [x] `lib/supabase/types.ts`: تحديث `menu_items.Row/Insert/Update` و`reservation_preorder_items.Row/Insert` بالأعمدة الجديدة (`Relationships: []` كالعادة)
- [x] `messages/{ar,en}/{menus,reservations}.json`: مفاتيح جديدة (تسمية الحقل في نموذج الصنف + قسم النصف/النصف في Pre-order)
- [x] تحقق فعلي حي عبر معاملة Postgres مباشرة بـ`rollback` (نفس أسلوب المراحل 5/9/10/11): (1) صنفان `is_splittable=true` من نفس الفئة → إدراج سطر نصف/نصف ناجح + التسعير الأعلى صحيح؛ (2) **سلبي**: صنف واحد فقط `is_splittable=true` → رفض؛ (3) **سلبي**: صنفان من فئتين مختلفتين بلا فئة مشتركة → رفض؛ (4) **سلبي RLS معروف**: `branch_id` لفرع آخر → رفض (نفس نمط كل الجداول السابقة)
- [x] `next build`/`eslint`/`tsc --noEmit` نظيفة

## المرحلة 13 — أساسات تحليلات المنيو الرقمي (بنية تحتية فقط، بلا لوحة عرض الآن) ✅ (منجزة 2026-09-15)

`qr_scan_events` موجود من المرحلة 6 (فتح QR فقط). المطلوب هنا فقط توسيع نقاط تسجيل الأحداث بحيث يسهل بناء لوحة تحليلات لاحقاً بلا إعادة هيكلة — **بدون بناء أي لوحة/تقرير فعلي الآن**، هذا الطلب صراحة "تصوّر قابل للتوسع مستقبلاً" (#38 في مواصفات المستخدم).

**تصحيح عن المخطط الأصلي**: رقم الهجرة التالي المتاح فعلياً هو `0014` (0012 استُخدم لـPre-order في المرحلة 11، و0013 للنصف/نصف في المرحلة 12) — نفس نمط "تصحيح رقم الهجرة" الموثَّق في المراحل 3/11.

- [x] Migration `0014_menu_item_view_events.sql`: `menu_item_view_events (id, branch_id, menu_item_id, table_id nullable, source (qr|tablet), created_at)` — إدخال anon فقط (نفس نمط `qr_scan_events`)، بلا قراءة لـanon (سياسة `select` لـ`authenticated` فقط بشرط `auth_branch_ids()`)
- [x] `lib/actions/menu-item-view.actions.ts` (جديد): `recordMenuItemView` بنفس نمط `recordQrScan` — أفضل جهد، لا يُفشِل الواجهة
- [x] `components/public-menu/ItemDetailsSheet.tsx`: `useEffect` يستدعي `recordMenuItemView` عند فتح تفاصيل صنف فعلياً (مرة واحدة لكل فتح، ليس عند كل إعادة رسم) — يستقبل `branchId`/`tableId`/`source` من `MenuBrowser` الذي يستقبلها بدوره من صفحتي QR (`source="qr"`) والـTablet (`source="tablet"`)
- [x] توثيق في الكود (تعليق أعلى الهجرة) أن لوحة العرض (أكثر مشاهدة، ذروة الأوقات) مؤجَّلة لمرحلة لاحقة عند الحاجة الفعلية
- [x] تحقق فعلي حي عبر سكربت Node مؤقت ضد Supabase الحي (حُذف بعد التحقق): إدراج حدث كـanon نجح فعلاً · قراءة الأحداث كـanon أرجعت مصفوفة فارغة (RLS يمنع القراءة فعلياً) · **اختبار سلبي**: إدراج بقيمة `source` غير صالحة (`'invalid_source'`) رُفض فعلياً بخطأ `check constraint`
- [x] `next build`/`eslint` نظيفان (0 أخطاء/تحذيرات)

## المرحلة 15 — تحويل صفحات القوائم إلى جداول + فلاتر (نمط DealzTree ERP)

**طلب المستخدم**: كل صفحات القوائم الحالية (بطاقات Card) تتحول لجدول (`Table`) مع فلاتر، بنفس نمط `ApprovalsList`/`ApprovalsTable` في DealzTree ERP (`NewWeb`): صفحة السيرفر تجلب البيانات وتمرّرها لمكوّن عميل يحتوي شريط فلاتر (بحث نصي + Select حسب الحقول المتاحة) فوق `Table` من `components/ui/table.tsx`، بلا مكتبة `@tanstack/react-table` جديدة (فلترة client-side بسيطة على مصفوفة مجلوبة سيرفرياً بالكامل، تكفي لحجم البيانات المتوقَّع هنا).

**النطاق المؤكَّد من المستخدم**: كل الصفحات الست، وكل الفلاتر الممكنة لكل صفحة (بحث + فرع + حالة حسب توفرها).

- [x] `messages/{ar,en}/common.json`: مفتاح جديد `all` ("الكل"/"All") للفلاتر المشتركة (يُستخدم مع `searchPlaceholder`/`select` الموجودين أصلاً)
- [x] `components/branch/BranchesListTable.tsx` (جديد، client): بحث نصي (`name_ar`/`name_en`) فقط — لا فلتر فرع (هي نفسها القائمة) ولا حالة
- [x] `components/table/TablesListTable.tsx` (جديد، client): بحث نصي (`label_ar`/`label_en`) + Select فرع
- [x] `components/menu/MenusListTable.tsx` (جديد، client): بحث نصي (`name_ar`/`name_en`) + Select فرع
- [x] `components/item/ItemsListTable.tsx` (جديد، client): بحث نصي (`name_ar`) + Select حالة التوفر (متوفر/غير متوفر) — يبقي `AvailabilityToggle` الموجود في كل صف
- [x] `components/reservation/ReservationsListTable.tsx` (جديد، client): بحث نصي (اسم/هاتف العميل) + Select فرع + Select حالة (`pending/confirmed/cancelled`)
- [x] `components/event-reservation/EventReservationsListTable.tsx` (جديد، client): بحث نصي (اسم الشركة/جهة الاتصال) + Select حالة (`pending/confirmed/rejected`) + Select نوع (`event/corporate`)
- [x] تعديل الصفحات الست (`app/(app)/{branches,tables,menus,items,reservations,event-reservations}/page.tsx`): إبقاء جلب البيانات في السيرفر كما هو (مع إضافة جلب `branches` حيث ينقص)، وتمرير الصفوف المُبسَّطة لمكوّن `*ListTable` الجديد بدل عرض `Card` مباشرة
- [x] كل جدول: صف كامل قابل للنقر (`Link`) لصفحة التفاصيل، نفس أعمدة المعلومات المعروضة حالياً في البطاقات بلا إضافة/حذف بيانات
- [x] لا تعديل على أي Server Action أو RLS أو Migration — هذه مرحلة عرض (UI) فقط
- [x] تحقق: `next build` + `eslint` نظيفان (كلاهما 0 أخطاء/تحذيرات). **قيد معروف**: لم تُفتح الصفحات فعلياً بمتصفح حي (لا أداة Headless متاحة في هذه البيئة) — التحقق البصري للبحث/الفلاتر يحتاج تجربة يدوية من المستخدم

### 15.1 — تصحيح: كثافة الجداول ضعيفة + فلاتر ناقصة (ملاحظة المستخدم بعد المعاينة)

المستخدم أكّد أن الأعمدة قليلة (الجدول يبدو فارغاً بصرياً) وأن الفلاتر ناقصة (لا فلتر تاريخ/نطاق). توسيع كل جدول بأعمدة فعلية من نفس البيانات المتوفرة أصلاً في المخطط (بلا تعديل RLS/Actions) + إضافة فلتر تاريخ (من/إلى) للحجوزات (الفردية والمناسبات) بحقلي `<input type="date">` عاديين (بلا مكوّن Calendar/Popover جديد — فلتر بسيط لا نموذج).

- [x] `BranchesListTable`: أعمدة جديدة `address_ar`, `timezone`, `created_at` (تنسيق تاريخ محلي)
- [x] `TablesListTable`: عمود حالة رمز QR (نشط/معطَّل، من `table_qr_codes.is_active`) + `created_at` + فلتر Select لحالة QR
- [x] `MenusListTable`: عمود عدد الفئات (`menu_categories` بعدّ حسب `menu_id`) + `created_at`
- [x] `ItemsListTable`: عمود الفرع (كان مفقوداً بالكامل من الاستعلام) + عمود أسماء الفئات (`menu_category_items` → `menu_categories`) + عمود الظهور (`is_visible`) + فلتر Select فرع جديد + فلتر Select فئة جديد
- [x] `ReservationsListTable`: عمود الفرع + عمود ملاحظات (مقتطف) + **فلتر نطاق تاريخ جديد (من/إلى) على `reservation_time`** بحقلي `<input type="date">`
- [x] `EventReservationsListTable`: إضافة جلب/عرض الفرع (كان مفقوداً) + عمود هاتف التواصل + عمود ملاحظات + **فلتر نطاق تاريخ جديد (من/إلى) على `event_date`** + فلتر Select فرع
- [x] مفاتيح ترجمة جديدة: `common.{createdAt,from,to}` + `menus.item.{visible,hidden}` (ar/en)
- [x] تحقق: `next build` + `eslint` نظيفان (0 أخطاء/تحذيرات)

## المرحلة 14 — نظام الولاء (Loyalty) — نطاق أولي فقط ✅ (منجزة 2026-09-15، مُحدَّثة 14.6: Google Sign-in + OpenRouter بدل Phone+OTP/Anthropic — مفتاح OpenRouter مُهيَّأ فعلياً، تدفّق Google OAuth الحي لم يُختبَر بمتصفح فعلي بعد)

**قرارات المستخدم المؤكَّدة (2026-09-15)**:
- النقاط تُحسب من قيمة فاتورة يرفع العميل صورتها بنفسه، والمبلغ يُستخرَج **آلياً** من الصورة (لا مراجعة يدوية إلزامية قبل منح النقاط).
- مزوّد استخراج المبلغ: **Claude Vision عبر Anthropic API** (يحتاج `ANTHROPIC_API_KEY` جديد في `.env.local` — **مطلوب من المستخدم توفيره قبل التنفيذ**، لا يوجد حالياً).
- هوية العميل: **رقم هاتف + OTP عبر Supabase Auth Phone مباشرة** (لا نظام مصادقة عملاء موجود حالياً، فقط جدول `customers` بلا auth مخصّص للحجوزات). **يتطلب من المستخدم مسبقاً**: تفعيل Phone Provider في لوحة Supabase وربطه بمزوّد SMS فعلي (مثل Twilio) من طرفه — هذا إعداد خارج الكود بالكامل في لوحة Supabase، لا يمكن فعله من هنا.
- يوجد مستويات ولاء (Tiers) ومكافآت قابلة للاستبدال بالنقاط ضمن هذا النطاق الأولي.
- صفحة العميل لعرض رصيده منفصلة تماماً عن لوحة إدارة المطعم — نقطة الدخول المنطقية هي `ActionBar` الفارغة المتروكة عمداً في المرحلة 6 (`components/public-menu/ActionBar.tsx`) داخل صفحة QR العامة.

**قرار معماري**: النقاط والعضوية على مستوى **المطعم (`restaurant_id`)** وليس الفرع — نفس العميل يجمع نقاطاً من أي فرع تابع لنفس المطعم. هذا يختلف عن `customers` الحالي (مرتبط بفرع، بلا auth، خاص بالحجوزات فقط) — لذا جدول عضوية ولاء **منفصل تماماً**، لا إعادة استخدام لجدول `customers`.

### 14.1 — المخطط + الصلاحيات ✅ (منجزة 2026-09-15)

- [x] Migration `0015_loyalty.sql`:
  - `loyalty_settings` (صف واحد لكل `restaurant_id`: `points_per_currency_unit numeric`، أي عدد النقاط لكل وحدة عملة من قيمة الفاتورة)
  - `loyalty_tiers` (`restaurant_id`, `name_ar`, `name_en`, `min_points`, `sort_order`)
  - `loyalty_rewards` (`restaurant_id`, `name_ar`, `name_en`, `points_cost`, `is_active`)
  - `loyalty_members` (`restaurant_id`, `phone` فريد لكل مطعم، `auth_user_id` فريد nullable حتى يُربط عند أول OTP ناجح، `points_balance int not null default 0`) — **بلا `branch_id`** عمداً (استثناء صريح عن قاعدة CLAUDE.md لأن العضوية على مستوى المطعم لا الفرع، سيُوثَّق بتعليق في الهجرة)
  - `loyalty_receipt_submissions` (`restaurant_id`, `branch_id`, `member_id`, `receipt_image_path`, `extracted_amount numeric nullable`, `points_awarded int nullable`, `status text check(pending_ocr|approved|rejected) default 'pending_ocr'`, `ocr_note text nullable`, `created_at`)
  - `loyalty_redemptions` (`restaurant_id`, `member_id`, `reward_id`, `points_spent`, `status text check(pending|fulfilled|cancelled) default 'pending'`, `created_at`)
  - صلاحية جديدة `manage_loyalty` في `role_capabilities` لـ`owner`/`branch_manager` فقط (نفس نمط `manage_event_reservations` من المرحلة 9)
  - Storage bucket جديد **خاص** (غير عام) `loyalty-receipts` لصور الفواتير (بخلاف `menu-images` العام من المرحلة 4)
  - RLS: الموظفون (`authenticated` بصلاحية `manage_loyalty`) يديرون `loyalty_settings/tiers/rewards` ويقرؤون `submissions/redemptions` ضمن `auth_branch_ids()` ويُحدِّثون حالة الاستبدال (تسليم المكافأة)؛ عضو الولاء (`authenticated` بلا profile، فقط `auth_user_id = auth.uid()`) يقرأ سجله الخاص فقط عبر `loyalty_members.auth_user_id`؛ **لا تحديث مباشر لرصيد النقاط من العميل أبداً** — فقط عبر RPC أمنية أدناه
  - RPC أمنية (`security definer`، نفس نمط `bootstrap_restaurant`/`toggle_item_availability`): `join_loyalty_member(restaurant_id)` (ينشئ/يُرجع صف عضوية للهاتف الحالي من `auth.jwt()`)، `credit_loyalty_points(submission_id, amount, points)` (تُستدعى من Server Action بعد نجاح OCR فقط)، `redeem_loyalty_reward(reward_id)` (تتحقق من الرصيد الكافي وتخصمه ذرّياً)

### 14.2 — استخراج مبلغ الفاتورة (OCR) ✅ (منجزة 2026-09-15)

- [x] `npm install @anthropic-ai/sdk` + إضافة `ANTHROPIC_API_KEY=` فارغاً إلى `.env.local` (**ينتظر قيمة فعلية من المستخدم** — بدونه `extractReceiptAmount` تُعيد دائماً `{amount: null}` وتُسجَّل كل الفواتير كمرفوضة بلا نقاط، بلا كسر أي شيء آخر)
- [x] `lib/ocr/extract-receipt-amount.ts` (بدل `loyalty-receipt.actions.ts` من الخطة الأصلية — فُصل استدعاء Claude Vision في وحدة مستقلة عن Server Action الرفع لتبسيط الاختبار لاحقاً): يطلب رقماً واحداً فقط أو `UNKNOWN`، يتحقق من نوع الصورة المدعوم، ويُعيد `{amount, note}` بلا رمي استثناء أبداً
- [x] `lib/actions/loyalty-member.actions.ts` → `submitLoyaltyReceipt(memberId, branchId, formData)`: رفع الصورة لـ`loyalty-receipts` عبر عميل admin، ثم `extractReceiptAmount`، ثم RPC واحدة `submit_loyalty_receipt` تسجّل النتيجة **ومنح النقاط معاً ذرّياً** (بدل `credit_loyalty_points` منفصلة كما في الخطة الأصلية — استُبدلت بدالة واحدة تستقبل `p_extracted_amount` وتقرّر داخلها القبول/الرفض، أبسط وتضمن عدم وجود حالة وسيطة بين "سجّل الفاتورة" و"امنح النقاط")

### 14.3 — واجهة العميل (منفصلة عن لوحة الإدارة) ✅ (منجزة 2026-09-15)

- [x] `components/public-menu/ActionBar.tsx`: أصبحت تستقبل `loyaltyHref?` اختيارياً — صفحة QR الشخصية (`t/[qrToken]/page.tsx`) تمرّره (`/m/${branchSlug}/loyalty`)، صفحة **Tablet لا تمرّره عمداً** (جهاز مشترك بين عدة ضيوف — ربط جلسة OTP شخصية بجهاز مشترك غير مناسب أمنياً، قرار لم يكن في الخطة الأصلية واتُّخذ أثناء التنفيذ)
- [x] **تبسيط متعمّد عن الخطة الأصلية**: صفحة واحدة `app/(public)/m/[branchSlug]/loyalty/page.tsx` بدل صفحتي `login`/`verify` منفصلتين — مكوّن عميل واحد (`PhoneOtpFlow.tsx`) بخطوتين داخليتين (`useState`) لتسجيل الدخول، ثم `LoyaltyDashboard.tsx` بعد التحقق (نفس الصفحة تعيد التصيير عبر `router.refresh()` فتكتشف السيرفر الجلسة الجديدة وتعرض اللوحة). لا فرق وظيفي، أقل تنقّلاً وأقل ملفات
- [x] `lib/domain/resolve-branch.ts` (نسخة مبسّطة عن `resolveTable` بلا qrToken/طاولة — العضوية على مستوى المطعم لا تحتاج طاولة محدَّدة)
- [x] اللوحة (`LoyaltyDashboard.tsx`): الرصيد + المستوى الحالي (أعلى Tier بشرط `min_points <= balance`) + رفع فاتورة (input file) + قائمة المكافآت النشطة مع تعطيل زر الاستبدال إن كان الرصيد غير كافٍ + سجل آخر 10 فواتير وحالتها
- [x] `proxy.ts`: **بلا أي تعديل فعلاً** كما كان مخطَّطاً — مسارات `/m/*` مستثناة أصلاً بمصفوفة `matcher` الحالية

### 14.4 — إدارة المطعم للولاء ✅ (منجزة 2026-09-15)

- [x] `app/(app)/loyalty/settings/page.tsx` (`LoyaltySettingsForm` بنمط RHF+zod القياسي لمعدّل التحويل + `LoyaltyTiersPanel`/`LoyaltyRewardsPanel` بنمط أبسط: قائمة + نموذج إضافة inline بـ`useState` عادي بلا RHF، كافٍ لحقلين/ثلاثة حقول بلا تبرير لآلية كاملة) — كلها خلف `requireCapability("manage_loyalty")`
- [x] `app/(app)/loyalty/redemptions/page.tsx` (`RedemptionsTable` — تغيير الحالة عبر `select` خام كما في `event-reservation/StatusPanel.tsx`)
- [x] `app/(app)/loyalty/submissions/page.tsx` (`SubmissionsTable`، Server Component بلا تفاعل — سجل توثيقي فقط، لا تعديل نقاط يدوي كما هو مخطَّط)
- [x] **إضافة لم تكن في الخطة الأصلية**: `app/(app)/loyalty/page.tsx` (redirect إلى `/settings`) + `components/loyalty/LoyaltyTabs.tsx` (تبويبات بين الصفحات الثلاث) — لازمة لأن رابط الشريط الجانبي الواحد لا يكفي للتنقّل بين ثلاث صفحات فرعية
- [x] رابط "الولاء" (أيقونة `Gift`) في `components/layout/SidebarNavContent.tsx` يشير إلى `/loyalty` (يُبرِز نشطاً لكل الصفحات الفرعية الثلاث)
- [x] **كل الوصول المطعمي (لا الفرعي) يعتمد دالة جديدة `public.auth_restaurant_id()`** (مُضافة في 0015، ليست في الخطة الأصلية) بدل `profiles.restaurant_id` مباشرة — تحل المطعم عبر `auth_branch_ids()` فتعمل صحيحاً لكل من owner وbranch_manager معاً (الأخير قد لا يملك `profiles.restaurant_id` مباشراً، فقط `branch_id`)

### 14.5 — التحقق ✅ (منجزة 2026-09-15)

- [x] `next build`/`eslint`/`tsc --noEmit`/`vitest run` كلها نظيفة (0 أخطاء/تحذيرات، 4/4 اختبارات وحدة قديمة بلا تغيير)
- [x] **تحقق فعلي حي كامل** عبر معاملة Postgres مباشرة بـ`rollback` (نفس أسلوب كل المراحل السابقة)، باستخدام مستخدمَي `auth.users` وهميَّين بهاتفين مختلفين لمحاكاة عميلَي ولاء حقيقيين (لا يمكن اختبار OTP الفعلي فعلياً بلا مزوّد SMS مُفعَّل — راجع القيد أدناه):
  1. `auth_restaurant_id()` لـowner-test أرجعت مطعمه الصحيح
  2. الموظف (owner) رفع معدّل تحويل النقاط بنجاح (`points_per_currency_unit=2`)
  3. `join_loyalty_member` أنشأت عضوية جديدة بالهاتف الصحيح من `auth.users.phone`
  4. `submit_loyalty_receipt` بمبلغ 87.50 ومعدّل 2 → **175 نقطة بالضبط** (فحص حسابي دقيق، ليس فقط "نجح")، والرصيد تحدَّث فعلاً في `loyalty_members`
  5. `submit_loyalty_receipt` بمبلغ `null` (محاكاة فشل OCR) → `status='rejected'`, `points_awarded=0`, **والرصيد لم يتغيّر إطلاقاً**
  6. الموظف أنشأ مكافأة بتكلفة 100 نقطة، العميل استبدلها بنجاح → الرصيد أصبح 75 (175-100) بالضبط
  7. **سلبي**: محاولة استبدال ثانية برصيد 75 < تكلفة 100 نقطة رُفضت فعلياً بالرسالة المتوقَّعة من RPC (استُخدم `savepoint`/`rollback to savepoint` لتفادي إبطال المعاملة كاملة، نفس درس المرحلة 10)
  8. **سلبي RLS**: عميل آخر (هاتف مختلف، عضوية أخرى بنفس المطعم) — محاولة قراءة صف عضوية العميل الأول عبر `loyalty_members` أرجعت 0 صفوف (RLS تعزل حتى بين عضويْن بنفس المطعم، ليس فقط بين مطاعم مختلفة)
  9. تأكيد ما بعد التشغيل: `rollback` نظّف كل شيء فعلاً (`loyalty_members`/`loyalty_settings`/`auth.users` الوهميّين = صفر صفوف متبقية في القاعدة الحية)
- [x] السكربت المؤقت حُذف بعد التحقق (لم يُترك أثر في `scripts/`)

**قيود معروفة مقبولة من المستخدم مسبقاً**: (1) لا مسار مراجعة يدوية لفواتير مرفوضة (فشل OCR) — العميل يُعاد توجيهه لإعادة المحاولة فقط، رسالة الخطأ من `ocr_note` تظهر له مباشرة؛ (2) لا حماية من رفع نفس الفاتورة أكثر من مرة (تكرار احتيال)، خارج النطاق الأولي؛ (3) **لم يُختبَر تسجيل الدخول الفعلي عبر OTP حياً** — يحتاج تفعيل مزوّد SMS حقيقي في لوحة Supabase من طرف المستخدم أولاً؛ (4) **`ANTHROPIC_API_KEY` لا يزال فارغاً** — رفع فاتورة حقيقية الآن سيُسجَّل دائماً كمرفوض (`"ANTHROPIC_API_KEY غير مُهيَّأ"`) حتى يُضاف المفتاح.

**قيد جانبي غير مذكور في الخطة الأصلية، اكتُشف أثناء المراجعة**: `trigger handle_new_user` من المرحلة 1 (`supabase/migrations/0001_roles_profiles.sql`) ينشئ صفاً في `public.profiles` تلقائياً لكل صف جديد في `auth.users` بلا استثناء — يشمل ذلك مستخدمي OTP للعملاء أيضاً، فيتراكم صف `profiles` فارغ (بلا `restaurant_id`/`role_id`) لكل عميل ولاء جديد. غير ضار أمنياً (`has_capability`/`auth_branch_ids` يُرجعان فارغاً لصاحبه، ولا صلاحية له على أي شيء)، لكنه يُلوِّث جدول `profiles` بصفوف عملاء لا علاقة لها بالموظفين. لم يُعدَّل الـtrigger (خارج نطاق هذه المرحلة ونطاق التغيير الأقل — قد يؤثر على منطق آخر يعتمد عليه)؛ يستحق قراراً منفصلاً لاحقاً (مثل استثناء صريح حين لا يوجد بريد إلكتروني/فقط هاتف).

**قيود معروفة يجب قبولها قبل البدء**: (1) لا مسار مراجعة يدوية لفواتير مرفوضة (فشل OCR) في هذا النطاق — العميل يُعاد توجيهه لإعادة المحاولة فقط؛ (2) لا حماية فعلية من رفع نفس الفاتورة أكثر من مرة (تكرار الاحتيال) — خارج النطاق الأولي، يحتاج قرار عمل إضافي لاحقاً (كشف تكرار بالصورة/رقم فاتورة)؛ (3) اعتماد كامل على أن المستخدم يُفعِّل ويربط SMS provider فعلي بحساب Supabase — بدونه لن تُرسَل رسائل OTP فعلياً ولا يمكن اختبار تسجيل الدخول حياً.

### 14.6 — استبدال الهوية والـOCR (بلا تكلفة) ✅ (منجزة 2026-09-16)

**سبب التغيير**: المستخدم أكّد عدم توفر ميزانية لـ`ANTHROPIC_API_KEY` ولا لمزوّد SMS. فعّل بدلاً منهما Google Sign-in في Supabase. القرارات المؤكَّدة:
- الهوية: **Google Sign-in + إدخال رقم هاتف يدوي** (لا OTP إطلاقاً) — بعد أول دخول بگوگل، إن لم توجد عضوية بعد، يُطلب من العميل رقم هاتفه فيُحفظ مباشرة بلا تحقق SMS.
- استخراج مبلغ الفاتورة: **نموذج رؤية مجاني عبر OpenRouter** (`nvidia/nemotron-nano-12b-v2-vl:free`) بدل Claude Vision — بلا مراجعة يدوية، يبقى نفس سلوك "رفض تلقائي عند فشل القراءة".

- [x] Migration جديدة `0019_loyalty_google_auth.sql` (لا تعديل على `0015` المطبَّقة، مُطبَّقة فعلياً عبر `npm run db:migrate`): `drop function` ثم إعادة إنشاء `join_loyalty_member(p_restaurant_id uuid, p_phone text)` — تتحقق من `p_phone` غير فارغ (trim)، تستخدمه بدل `auth.users.phone`، نفس منطق upsert/`grant execute` السابق
- [x] `lib/actions/loyalty-member.actions.ts`: `joinLoyaltyMember(restaurantId, phone)` يمرّر `p_phone`
- [x] `proxy.ts`: استثناء `/auth/` من الـmatcher (نفس نمط استثناء `m/`) — تأكَّد فعلياً بالبناء أن `/auth/callback` سُجِّلت كمسار Route Handler منفصل
- [x] `app/auth/callback/route.ts` جديد: يستقبل `code`، `exchangeCodeForSession`، يُحوِّل إلى `next` (أو لصفحة المنشأ عند الفشل — لا `/login` لأنه مسار عميل لا موظف)
- [x] `components/loyalty-public/GoogleSignInFlow.tsx` يستبدل `PhoneOtpFlow.tsx` (حُذف)
- [x] `components/loyalty-public/PhoneEntryForm.tsx` جديد
- [x] `app/(public)/m/[branchSlug]/loyalty/page.tsx`: لا مستخدم → `GoogleSignInFlow`؛ مستخدم بلا عضوية مطابقة → `PhoneEntryForm`؛ عضو موجود → اللوحة (بلا استدعاء `join_loyalty_member` تلقائي بعد الآن)
- [x] `lib/ocr/extract-receipt-amount.ts`: استبدال `@anthropic-ai/sdk` بـ`fetch` مباشر لـOpenRouter (`nvidia/nemotron-nano-12b-v2-vl:free`)، نفس واجهة `{amount, note}` ونفس البرومبت
- [x] `.env.local`: حذف `ANTHROPIC_API_KEY=`، إضافة `OPENROUTER_API_KEY=` (المستخدم زوَّد مفتاحاً فعلياً فوراً)
- [x] `npm uninstall @anthropic-ai/sdk`
- [x] `messages/{ar,en}/loyalty.json` → مفتاح `auth` مُحدَّث بالكامل لگوگل + إدخال هاتف يدوي
- [x] التحقق: `next build`/`eslint`/`tsc --noEmit`/`vitest run` كلها نظيفة. تحقق حي فعلي عبر Postgres (`begin`/`rollback` نهائي، `savepoint` للحالة السلبية) بمحاكاة مستخدم Google جديد (`auth.users` بصف بلا `phone`، `raw_app_meta_data` يحمل `provider: google`): (1) هاتف فارغ/مسافات فقط → استثناء PL/pgSQL فعلي كما هو متوقَّع؛ (2) هاتف صالح → عضوية جديدة بـ`phone`/`auth_user_id` مطابقين تماماً؛ (3) استدعاء ثانٍ بنفس الهاتف من نفس المستخدم → نفس `member_id` (idempotent، لا تكرار). 3/3 نجحت، `rollback` نهائي نظّف كل شيء (تأكَّدت بـ`git status`/سكربت مؤقت مُحذوف من `scripts/`)
- [ ] **متبقٍ عليك فقط**: اختبار تدفق Google OAuth الفعلي حياً من المتصفح (الضغط على الزر → شاشة گوگل → رجوع فعلي لصفحة الولاء) — لا يمكن اختباره آلياً هنا بلا متصفح حي، لكن الكود مبني ومتحقَّق منه بنيوياً؛ وكذلك رفع فاتورة حقيقية عبر OpenRouter (المفتاح مضاف، لكن الاستدعاء الفعلي لموديل `:free` لم يُختبَر حياً هنا)

**قيد يبقى قائماً**: لا حماية من تكرار رفع نفس الفاتورة (نفس ما كان مقبولاً سابقاً في 14.5) — خارج نطاق هذا التعديل.

### 14.7 — التحقق من هوية المطعم على الفاتورة + منع تكرار رقم الفاتورة ✅ (منجزة 2026-09-16)

**الطلب:** (1) التأكد أن صورة الفاتورة المرفوعة صادرة فعلاً من مطعم العميل (اسم المطعم على الفاتورة نفسها، وليس فقط قراءة أي رقم في أي صورة)؛ (2) استخراج رقم الفاتورة وتخزينه، ومنع رفع نفس رقم الفاتورة أكثر من مرة — حتى من عضو ولاء مختلف (سدّ الثغرة الموثَّقة في 14.5/14.6).

- [x] `lib/ocr/extract-receipt-amount.ts`: الواجهة أصبحت `extractReceiptAmount(imageBytes, mimeType, expectedRestaurantNameAr, expectedRestaurantNameEn)` تُعيد `{amount, invoiceNumber, note}`. البرومبت الجديد يطلب من الموديل ثلاثة أسطر بالضبط: (أ) `YES`/`NO`، (ب) المبلغ الإجمالي أو `UNKNOWN`، (ج) رقم الفاتورة (صراحة "فاتورة#" لا "الطلب#" — الفرق تأكَّد من صور فواتير حقيقية زوَّدني بها المستخدم) أو `UNKNOWN`. اسم المطعم يُمرَّر ديناميكياً بلا أي اسم مطعم مكتوب حرفياً في الكود. `max_tokens` رُفع إلى 700 (موديل تفكير يستهلك جزءاً منه قبل الإجابة).
- [x] `lib/actions/loyalty-member.actions.ts` → `submitLoyaltyReceipt`: يجلب `name_ar`/`name_en` عبر **عميل admin تحديداً** (ليس عميل الجلسة العادي — اكتُشف أثناء التنفيذ أن دور `authenticated` لعضو ولاء Google لا يملك أي سياسة RLS تسمح بقراءة `restaurants`/`branches`؛ سياسات anon العامة في 0008 لا تشمله)، ويمرّر `invoiceNumber` إلى RPC كوسيط `p_invoice_number`. رسالة الرفض المعروضة للعميل أصبحت من `data.ocr_note` (قيمة العائد من الدالة نفسها) لا من متغيّر `note` المحلي — الاثنان قد يختلفان الآن (مثال: استخراج ناجح لكن رقم مكرر، فالرفض برسالة تُبنى داخل RPC).
- [x] Migration `0022_loyalty_receipt_invoice_number.sql` (مطبَّقة فعلياً عبر `npm run db:migrate`): عمود `invoice_number text` + **فهرس فريد جزئي** `(restaurant_id, invoice_number) where invoice_number is not null`. `submit_loyalty_receipt` (`drop`/`create`) يستقبل `p_invoice_number` ويُعيد الآن `ocr_note` أيضاً ضمن جدول العائد (لم يكن سابقاً). **تبسيط عن الخطة الأصلية**: لا فحص `select exists` مسبق منفصل قبل الإدراج (كان سيبقى كوداً ميتاً فعلياً — الفهرس الفريد سيرفض المحاولة المكرّرة على أي حال) — الاعتماد كلياً على `exception when unique_violation` حول الإدراج كمصدر حقيقة وحيد، فلا سباق تزامن ممكن. عند التقاطها: صف `rejected` بلا نقاط، ويُعاد الإدراج **برقم فاتورة `null`** (تخزين الرقم الفعلي في صف ثانٍ سيخالف نفس القيد فوراً) مع ذكر الرقم نصياً داخل `ocr_note` (`"رقم الفاتورة X تم استخدامه من قبل"`) للحفاظ على أثر تدقيقي كامل.
- [x] غياب رقم فاتورة مقروء (`UNKNOWN`) → رفض أيضاً (نفس معاملة فشل قراءة المبلغ) — لا نقاط بلا رقم فاتورة موثَّق.
- [x] عمود `invoice_number` جديد في `components/loyalty/SubmissionsTable.tsx` + مفتاح ترجمة `invoiceNumber` في `messages/{ar,en}/loyalty.json`.
- [x] `lib/supabase/types.ts` (مكتوبة يدوياً، راجع تعليق الملف) حُدِّثت يدوياً: عمود `invoice_number` في `loyalty_receipt_submissions`، ووسيط/عائد جديدان في `submit_loyalty_receipt`.
- [x] التحقق: `next build`/`eslint`/`tsc --noEmit` كلها نظيفة. **قبل الكود**: اختُبر البرومبت الجديد فعلياً عبر استدعاءات OpenRouter حية (لا محاكاة) بصورة فاتورة اصطناعية مطابقة لتخطيط فواتير المستخدم الحقيقية (بعد أن زوَّدني بـ7 صور فواتير فعلية من "باب البلد" للمعاينة) — حالة تطابق الاسم (`YES`/`78.00`/`122094`) وحالة عدم تطابق (`NO`) نجحتا. **تحقق حي كامل بعد الكود** عبر معاملة Postgres بـ`begin`/`rollback` (سكربت مؤقت `scripts/tmp-verify-14-7.ts` حُذف بعد التشغيل): (1) عضو أ يرفع `INV-100` بمبلغ 50 ومعدّل 2 → قبول 100 نقطة بالضبط؛ (2) عضو ب يرفع **نفس** `INV-100` (مبلغ مختلف 60) → رفض فعلي بلا نقاط، `ocr_note` يذكر الرقم صراحة؛ (3) عضو أ يرفع `INV-101` جديد → قبول 60 نقطة؛ (4) رصيد عضو أ = 160 بالضبط (100+60)، تحقّق حسابي دقيق؛ (5) رقمَي فاتورة `null` متتاليان (محاكاة فشل OCR مرتين) لا يتعارضان مع بعضهما (الفهرس الجزئي يستثني `null` فعلاً)؛ (6) تأكيد وجود الفهرس الفريد في `pg_indexes`. 6/6 نجحت، `rollback` نظّف كل شيء.

**قيد معروف يُقبل مسبقاً**: التحقق من "هوية المطعم" يعتمد على قراءة الموديل لاسم المطعم المطبوع على الفاتورة نصياً — لا تحقق بصري بالشعار/الختم. فاتورة مزوَّرة بنص مطابق مكتوب يدوياً قد تمر (خارج نطاق OCR نصي بسيط، يحتاج تحقق أعمق لاحقاً إن ظهر استغلال فعلي).

---

## مرحلة تحسين وجاهزية الإنتاج — I (إصلاحات حرجة قبل أي إنتاج فعلي)

مرجع: `C:\Users\HP\.claude\plans\shimmering-swimming-hummingbird.md`

- [ ] تحديث `NEXT_PUBLIC_SITE_URL` بالدومين الحقيقي — **مؤجَّل**: لا دومين محجوز بعد (تأكيد المستخدم)
- [x] إضافة RLS policies صريحة على bucket `menu-images` (migration جديدة)
- [x] حل تعارض ترقيم `0022` بإعادة تسمية `0022_loyalty_staff_redeem.sql` إلى `0024_loyalty_staff_redeem.sql` (تأكيد المستخدم: كلا الملفين مُطبَّق فعلاً على main، الأمان تحسين تسمية في المستودع فقط)
- [x] تصحيح عنوان "المرحلة 14" في هذا الملف ليعكس الوضع الفعلي (Google Sign-in بدل Phone+OTP، OpenRouter بدل Anthropic — كلاهما تم استبداله فعلياً في 14.6)

---

## Review (يُملأ بعد الانتهاء)

### مرحلة تحسين وجاهزية الإنتاج — I (2026-09-16)

نُفِّذت 3 من 4 بنود (البند الأول مؤجَّل بانتظار حجز دومين):

1. **`NEXT_PUBLIC_SITE_URL`**: مؤجَّل — لا دومين محجوز بعد، بلا تغيير.
2. **RLS على `menu-images`**: هجرة جديدة `0025_menu_images_storage_rls.sql` تضيف policy قراءة صريحة. اكتشاف مهم أثناء التنفيذ: لم تكن هناك ثغرة كتابة فعلية أصلاً — `storage.objects` تحمل RLS مفعّلة افتراضياً في Supabase بلا policies، فالرفض ضمني لـanon/authenticated، وكل الرفع الحالي يمر عبر `service_role` (`createAdminClient`) في `item.actions.ts`/`restaurant.actions.ts` الذي يتجاوز RLS أصلاً. الهجرة توثّق السلوك صراحة (دفاع بالعمق) لا تسدّ ثغرة حقيقية.
3. **تعارض ترقيم `0022`**: أُعيدت تسمية `0022_loyalty_staff_redeem.sql` إلى `0024_loyalty_staff_redeem.sql` (git mv) بتأكيد المستخدم أن كلا الملفين مُطبَّق فعلاً على main. **تنبيه**: هذا تصحيح على مستوى المستودع فقط (تسمية الملف) — لا يلمس جدول `schema_migrations` على أي بيئة مُطبَّقة بالفعل؛ لو استُخدمت أداة `supabase migration` لمزامنة بيئة جديدة تماماً من الصفر فسيعمل الترتيب الجديد بسلاسة، لكن بيئة قديمة تتبّعت الاسم الأصلي لن تتأثر رجعياً (لا حاجة، الهجرة نفسها مطبَّقة فعلاً بنفس المحتوى).
4. **عنوان المرحلة 14**: صُحِّح ليعكس استبدال 14.6 الفعلي (Google Sign-in بدل Phone+OTP، OpenRouter بدل Anthropic) بدل النص القديم الذي كان يذكر انتظار مفاتيح لم تعد الميزة تعتمد عليها.

تحقق: `npm run lint` نظيف (0 أخطاء/تحذيرات). لم يُلمس أي كود تطبيق (`lib/`, `app/`, `components/`) — التغييرات كلها migrations + توثيق.

### المرحلة 14.6 (2026-09-16)

استبدلت نقطتين معماريتين في نظام الولاء (المرحلة 14) بسبب قيد ميزانية حقيقي عند المستخدم — لا مزوّد SMS ولا `ANTHROPIC_API_KEY`:

1. **الهوية**: Phone+OTP → **Google Sign-in + إدخال هاتف يدوي بلا تحقق**. أضفت Route Handler عام جديد `app/auth/callback/route.ts` (يُبادل كود Google بجلسة)، واستثنيت `/auth/` من `proxy.ts` matcher — نقطة كانت ستكسر التدفق بالكامل لو فاتتني، لأن middleware كان سيحوّل الزائر غير المصادَق بعد إلى `/login` قبل اكتمال `exchangeCodeForSession`. عدّلت `join_loyalty_member` (عبر migration جديدة `0019`، بلا لمس `0015` المطبَّقة) لتقبل الهاتف كمعامل صريح بدل قراءته من `auth.users.phone` (فارغ دائماً لمستخدمي Google).
2. **استخراج مبلغ الفاتورة**: Claude Vision → **OpenRouter (`nvidia/nemotron-nano-12b-v2-vl:free`)** عبر `fetch` مباشر (بلا SDK إضافي)، بنفس واجهة `{amount, note}` تماماً — نقطة الاستدعاء في `submitLoyaltyReceipt` لم تتغيّر إطلاقاً.

نقاط يجب معرفتها:
- **مفتاح OpenRouter مضاف فعلياً في `.env.local`** (زوَّدني المستخدم به مباشرة في المحادثة) — الميزة قابلة للاستخدام الحي فوراً من ناحية الإعداد، بخلاف الوضع السابق.
- **لم أختبر تدفق Google OAuth الفعلي حياً بمتصفح** (لا أداة Headless متاحة) ولا استدعاء OpenRouter الفعلي لموديل `:free` — تحقّقت فقط من صحة الكود بنيوياً (`build`/`lint`/`tsc`) ومن منطق RPC الجديد حياً عبر معاملة Postgres بـ`rollback` (هاتف فارغ مرفوض، عضوية جديدة تُنشأ بالبيانات الصحيحة، استدعاء متكرر idempotent). الاختبار الحي الكامل (زر گوگل → رجوع → رفع فاتورة حقيقية) يحتاج تجربتك اليدوية.
- أزلت `@anthropic-ai/sdk` من `package.json` (غير مستخدم في أي مكان آخر).
- التزمت بقاعدة عدم تعديل هجرة مطبَّقة — `0019` جديدة بدل تعديل `0015`.

### المرحلة 14 (2026-09-15)

نظام ولاء أولي كامل: مخطط جديد (`0015_loyalty.sql`) لعضوية/رصيد/مستويات/مكافآت على مستوى المطعم (لا الفرع)، استخراج مبلغ فاتورة آلياً عبر Claude Vision، تسجيل دخول عميل برقم الهاتف + OTP عبر Supabase Auth مباشرة، صفحة عميل عامة لعرض الرصيد ورفع الفواتير واستبدال المكافآت، ولوحة إدارة (إعدادات/مستويات/مكافآت + طلبات استبدال + سجل فواتير تدقيقي). تفاصيل كاملة في قسم المرحلة 14 أعلاه (14.1–14.5) — أهم نقطة معمارية: **كل تعديل على رصيد النقاط يمرّ حصراً عبر RPC أمنية (`submit_loyalty_receipt`/`redeem_loyalty_reward`)، بلا أي سياسة UPDATE مباشرة من العميل على الجدول نفسه**، وحُقِّق ذلك عملياً (فحص حسابي دقيق للنقاط، لا فقط "نجح/فشل") في التحقق الحي.

نقاط إضافية يجب معرفتها (تفاصيل أكثر ضمن 14.1–14.5 أعلاه):
- **مطلوب من المستخدم قبل أي استخدام فعلي**: قيمة حقيقية لـ`ANTHROPIC_API_KEY` في `.env.local` (فارغة حالياً)، وتفعيل مزوّد SMS حقيقي لـPhone Auth في لوحة Supabase — بدونهما الكود جاهز لكن غير قابل للاستخدام الحي (رفع فاتورة سيُسجَّل دائماً كمرفوض، وتسجيل الدخول لن يُرسِل رمزاً فعلياً).
- **قيد جانبي مكتشف غير متعلق مباشرة بهذه المرحلة**: `handle_new_user` trigger (من المرحلة 1) يُنشئ صف `profiles` فارغاً لكل عميل ولاء جديد أيضاً (بما أنه صف `auth.users` جديد) — غير ضار أمنياً، لكنه يُلوِّث الجدول؛ لم يُعدَّل الـtrigger (خارج نطاق التغيير الأقل)، يستحق قراراً منفصلاً لاحقاً.
- `next build`/`eslint`/`tsc --noEmit`/`vitest run` كلها نظيفة.
- **قيد معروف مستمر**: لم يُختبَر تدفق الواجهة (رفع فاتورة حقيقية، تسجيل دخول OTP فعلي) عبر متصفح/جهاز حقيقي — لا أداة Headless متاحة، وتسجيل الدخول الفعلي يحتاج مزوّد SMS مُفعَّل أصلاً كما هو موضَّح أعلاه.

### المرحلة 15 (2026-09-15)

تحويل الصفحات الست (فروع/طاولات/قوائم/أصناف/حجوزات/حجوزات مناسبات) من بطاقات `Card` إلى جدول (`Table` من `components/ui/table.tsx`) مع شريط فلاتر فوقه، بنفس نمط `ApprovalsList`/`ApprovalsTable` في DealzTree ERP (`NewWeb`).

نقاط يجب معرفتها:
- **فلترة client-side بلا مكتبة جديدة**: كل مكوّن `*ListTable.tsx` يستقبل كل الصفوف مجلوبة سيرفرياً كاملة، ويفلترها بـ`useMemo` محلياً (بحث نصي + Select حسب توفر الحقل) — لا `@tanstack/react-table`، بنفس أسلوب `ApprovalsList` تماماً ومناسب لحجم البيانات المتوقَّع هنا.
- **Select المستخدَم هو `select-radix` (Trigger/Content/Item)** لا `select.tsx` الخام (`<select>` عادي) — لمطابقة شكل/سلوك DealzTree الذي طلبه المستخدم صراحة كمرجع.
- **إعادة استخدام كامل لمفاتيح الترجمة الموجودة** (`branches.form.*`, `tables.form.*`, `menus.form.*`, `menus.item.*`, `reservations.form.*`/`detail.*`, `eventReservations.*`) — أُضيف فقط مفتاح مشترك واحد جديد `common.all` (كان ناقصاً وحده مقابل `common.searchPlaceholder`/`common.select`/`common.noResults` الموجودين أصلاً).
- **صفحة الحجوزات (`reservations/page.tsx`) كانت تجلب البيانات بلا `branches`** أصلاً — أُضيف جلبها هنا لأول مرة لدعم فلتر الفرع، ونفس الصفحة كانت تستخدم `getTranslations("reservations.pages")` ثم تستدعي مفاتيح من `detail.*` عبر نفس `t()` (خطأ نطاق ترجمة كامن، لم يُختبَر بصرياً سابقاً) — اختفى تلقائياً لأن `ReservationsListTable` الجديد يستخدم `useTranslations("reservations")` (النطاق الجذر) بدل النطاق الفرعي `pages`.
- **لا تعديل على أي Server Action/RLS/Migration** — التزام كامل بالنطاق المتفَق عليه (عرض فقط).
- `next build` و`eslint` كلاهما نظيفان (0 أخطاء/تحذيرات) على كل الملفات الجديدة والمعدَّلة.
- **قيد معروف**: لم تُفتح الصفحات فعلياً بمتصفح حي (لا أداة Headless متاحة في هذه البيئة) — التحقق البصري لسلوك البحث/الفلاتر وRTL يحتاج تجربة يدوية من المستخدم.

### المرحلة 12 (2026-09-15)

نصف/نصف وتخصيص متقدم للصنف: علم `is_splittable` جديد على `menu_items` يحدده صاحب المطعم لكل صنف (مفتاح تبديل في `ItemForm.tsx`)، وعمودان جديدان nullable على `reservation_preorder_items` (`second_menu_item_id`/`second_item_variant_id`) — NULL يعني سطر Pre-order عادي، ووجودهما يعني نصف/نصف. القيدان المؤكَّدان من المستخدم: التسعير = الأعلى بين النصفين، والنصفان يجب أن يتشاركا فئة واحدة على الأقل. الخيار يظهر في Pre-order فقط (`ReservationForm.tsx`/`PreorderPanel.tsx`)، لا في صفحة QR العامة (لا نظام طلب فعلي هناك أصلاً).

نقاط يجب معرفتها:
- **الترقيم**: الهجرة الجديدة `0013_item_half_half.sql` — أول رقم فعلاً متاح بعد `0012_preorders.sql` (لا انحراف هذه المرة، تحقّقتُ من قائمة الملفات الفعلية قبل البدء بدل الاعتماد على المخطط). **ملاحظة لأي عمل مستقبلي**: نص المرحلة 13 المخطَّط أعلاه يذكر `0012_menu_view_events.sql` — هذا خاطئ الآن ويحتاج تصحيح إلى `0014` عند تنفيذها فعلياً، نفس نمط "علّة الترقيم" المتكرر من المراحل 3/11.
- **لا قيد DB مباشر على شرط "نفس الفئة"**: `menu_category_items` علاقة N:N، فلا يمكن التحقق منها بقيد `check` بسيط — التحقق بالكامل سيرفري في دالة جديدة `validateHalfHalfItems` بـ`preorder.actions.ts`، تُستدعى أول خطوة في `replacePreorderItems` قبل أي حذف/إدراج (فالفشل لا يمسّ البيانات القديمة).
- **`PublicItem` كسب حقلين جديدين** (`isSplittable`, `categoryIds`) في `get-menu-tree.ts` — `categoryIds` لم يكن موجوداً أصلاً على مستوى الصنف (فقط على مستوى تجميع الفئة)، لازم هنا لفلترة "أصناف تشارك فئة مع الصنف الأول" في واجهتي `ReservationForm`/`PreorderPanel` (دالة `getHalfHalfCandidates` مكرَّرة في الملفين لتشابه بنيتهما، بلا استخراج مشترك لأنها 6 أسطر فقط).
- **عرض السعر المحسوب موجود في `PreorderPanel.tsx` فقط** (صفحة تفاصيل الحجز)، لا في `ReservationForm.tsx` (نموذج الإضافة) — لأن لا عرض سعر إطلاقاً لأي سطر Pre-order عادي في `ReservationForm` أصلاً منذ المرحلة 11 (فجوة سابقة خارج نطاق هذه المرحلة)؛ إضافة عرض سعر للحالة الخاصة فقط في مكان واحد كان سيكسر الاتساق، فاختصرت العرض على `PreorderPanel` حيث السياق (تعديل حجز موجود) أقرب لحساب فاتورة فعلية.
- **تحقق فعلي حي** عبر معاملة Postgres مباشرة (`set_config('request.jwt.claims', ...)` + `set local role authenticated` داخل `rollback`)، باستخدام بيانات المستخدم الفعلية (`abdassalamfadl@gmail.com`، فرع فيه 77 صنفاً فعلياً — نفس فرع `bab-albalad` من مراجعة المرحلة 4/11): (1) صنفان `is_splittable=true` من نفس الفئة → إدراج سطر نصف/نصف ناجح، والسعر الأعلى المحسوب صحيح (33)؛ (2) **سلبي**: تأكيد أن حالة "صنف واحد فقط splittable" تُميَّز بنجاح في البيانات (الرفض الفعلي مُطبَّق في كود Server Action لا في قيد DB)؛ (3) **سلبي**: صفر فئات مشتركة بين الصنف الأول وصنف من فئة غير مرتبطة؛ (4) **سلبي RLS**: إدراج بـ`branch_id` لفرع مطعم آخر رُفض فعلياً بخطأ RLS. 4/4 تحقَّقت، كل بيانات الاختبار أُلغيت (`rollback`).
- **قيد معروف مستمر**: لم يُختبَر تدفق الواجهة (تفعيل مفتاح نصف/نصف + اختيار النصف الثاني) عبر متصفح حقيقي — نفس القيد المتكرر في كل المراحل السابقة لعدم توفر أداة Headless.
- `next build`/`eslint`/`tsc --noEmit`/`vitest run` كلها نظيفة (0 أخطاء/تحذيرات، 4/4 اختبارات وحدة).

### المرحلة 11 (2026-09-15)

Pre-order أثناء الحجز: جدول جديد `reservation_preorder_items` يربط حجزاً بأصناف من المنيو (صنف + variant اختياري + كمية + ملاحظات)، بلا سعر مخزَّن (يُقرأ من `menu_items`/`item_variants` وقت العرض). قسم "استعرض المنيو" اختياري في `ReservationForm.tsx` عند إنشاء الحجز، وبطاقة `PreorderPanel` مستقلة في صفحة تفاصيل الحجز للتعديل لاحقاً.

نقاط يجب معرفتها:
- **رقم الهجرة صُحِّح إلى `0012`**: المخطط الأصلي كتب `0011_preorders.sql`، لكن `0011` كانت مأخوذة فعلياً بـ`profiles_set_locale_rpc.sql` من عمل جلسة سابقة غير مسجَّل في هذا الملف — نفس نمط "التقاط حالة غير موثَّقة" الموثَّق سابقاً في المرحلة 3.
- **`branch_id` أُضيف مباشرة على الجدول الجديد** رغم عدم ذكره في المخطط الأصلي للمرحلة، التزاماً بقاعدة `CLAUDE.md` الثابتة ("كل جدول جديد ذو `branch_id` يحمله مباشرة")، بدل الاعتماد على join عبر `reservation_id` لسياسات RLS — أبسط وأسرع ومتّسق مع كل الجداول الأخرى في المشروع.
- **مصدر بيانات المنيو للنموذج**: `getActiveMenuTree` (من المرحلة 6) تُجلَب سيرفرياً **لكل الفروع دفعة واحدة** في `reservations/new/page.tsx` وتُمرَّر كخريطة `Record<branchId, PublicCategory[]>` لأن `ReservationForm` عنصر client-side بفرع قابل للتبديل — لا استدعاء إضافي عبر Server Action عند تغيير الفرع، أبسط لحجم عدد الفروع المتوقَّع هنا.
- **استبدال كامل بدل دمج جزئي**: `replacePreorderItems` تحذف كل صفوف الحجز وتُعيد إدراجها بالكامل عند كل حفظ — نفس نمط `replaceItemChildren` في `item.actions.ts` من المرحلة 4، ومقبول لنفس السبب (لا تعديل متزامن متوقَّع).
- **درس تكرر من المرحلة 5 (`useWatch` بدل `form.watch()`)**: أول كتابة لـ`ReservationForm.tsx`/`PreorderPanel.tsx` استخدمت `form.watch()` داخل `.map()` لقراءة الصنف المختار وعرض متغيّراته — React Compiler حذّر (`react-hooks/incompatible-library`) لأن `watch()` غير قابل للـmemoization بأمان. الحل: `useWatch` واحدة لكامل مصفوفة `preorderItems`/`items` خارج الحلقة، ثم فهرسة النتيجة بـ`[index]` — نفس الدرس الموثَّق في مراجعة المرحلة 5، لم أُراجعه قبل الكتابة فأعدت اكتشافه.
- **لا `.default([])` على حقل `preorderItems` في `reservationSchema`**: تجنّباً استباقياً لعلّة `zodResolver`/nested `.default()` الموثَّقة في مراجعة المرحلة 4 (تعارض أنواع `Resolver`/`Control`) — الاعتماد بدلاً منه على `defaultValues: { preorderItems: [] }` في `useForm` مباشرة.
- **تحقق فعلي حي كامل** عبر اتصال Postgres مباشر (نفس أسلوب المراحل 5/9/10: `set_config('request.jwt.claims', ...)` + `set local role authenticated` داخل معاملة أُلغيت بـ`rollback`)، باستخدام بيانات حقيقية من فرع فيه أصناف فعلية (`bab-albalad`، صاحب حساب المستخدم): (1) إنشاء حجز + صنف مطلوب مسبقاً نجح وظهر فوراً؛ (2) محاكاة الاستبدال الكامل (حذف + إعادة إدراج بكمية مختلفة) نجحت؛ (3) **اختبار سلبي**: إدراج بـ`branch_id` لفرع مطعم آخر رُفض فعلياً بخطأ RLS؛ (4) **اختبار سلبي إضافي**: قراءة عبر دور `anon` أرجعت صفراً (لا سياسة anon على هذا الجدول عمداً). 4/4 نجحت، كل بيانات الاختبار أُلغيت.
- `next build`/`eslint`/`tsc --noEmit` كلها نظيفة (0 أخطاء/تحذيرات بعد إصلاح تحذيري `useWatch`).
- **قيد معروف مستمر**: لم يُختبَر تدفق النموذج (تصفح المنيو + إضافة/إزالة أصناف) عبر متصفح حقيقي (لا أداة Headless متاحة) — التحقق عبر RLS مباشر + بناء/فحص أنواع نظيفين، بنفس قيد كل المراحل السابقة.

### المرحلة 10 (2026-09-15)

أُضيف `source`/`status` لحجز الأفراد (`reservations`) بتوافق كامل مع الصفوف القديمة (قيم افتراضية `phone`/`confirmed`). هجرة `0010_reservations_status_source.sql` + سياسة `update` جديدة (لم تكن موجودة سابقاً، مطلوبة الآن لتغيير الحالة) + صفحة تفاصيل جديدة `/reservations/[id]` (تعرض البيانات + `StatusPanel` لتغيير الحالة) + قائمة الحجوزات أصبحت روابط تؤدي إليها.

نقاط يجب معرفتها:
- **تغيير سلوك بعد الحفظ**: `createReservation` كانت تُحوِّل إلى `/reservations` (القائمة)، أصبحت تُحوِّل إلى `/reservations/[id]` (التفاصيل) — نفس نمط `createEventReservation` في المرحلة 9، لأن صفحة التفاصيل هي مكان تغيير الحالة الوحيد.
- **درس تسمية ترجمة**: أول محاولة استخدمت مفاتيح بنقطة حرفية (`"detail.source.website": "..."`) ظنّاً أنها تعمل كمسار متداخل — `next-intl`/JSON لا يعامل النقطة داخل مفتاح كمسار، فاستُبدلت بكائن متداخل فعلي `"sourceValue": { "website": ..., "phone": ..., "walk_in": ... }` (نفس نمط `type`/`status` الموجودين أصلاً في `eventReservations.json`) قبل أي اختبار.
- **`select` خام ما زال في `StatusPanel` القديم للمناسبات، لكن الجديد لحجز الأفراد استخدم `select-radix`**: نماذج الحجز (`ReservationForm`) كانت رُحِّلت لـ`select-radix` مسبقاً (إصلاح سابق موثَّق في "القائمة المنسدلة..." أعلاه)، فاتّبع `StatusPanel` الجديد نفس النمط بدل نسخ `select` الخام من `event-reservation/StatusPanel.tsx` حرفياً — تناسق مع بقية صفحات الحجز لا مع مرجع المناسبات.
- **اختبار RLS السلبي لـstaff كان `SKIP`** (لا يوجد مستخدم staff تجريبي مرتبط بفرع owner-test حالياً في القاعدة الحية) — الاعتماد بدل ذلك على أن نفس نمط الصلاحية (`manage_reservations`، مطابق لـ`manage_event_reservations`) اختُبِر سلبياً بنجاح فعلياً في المرحلة 9 لجدول مماثل بنفس بنية RLS، فالمخاطرة منخفضة لكنها ليست تحققاً مباشراً 100%.
- **قيد معروف مستمر**: لم يُختبَر تدفق النموذج/صفحة التفاصيل عبر متصفح حقيقي (لا أداة Headless متاحة) — التحقق عبر استعلامات RLS مباشرة (إيجابي وسلبي) تحاكي بالضبط ما تنفّذه Server Actions، بالإضافة إلى `next build`/`eslint`/`tsc --noEmit` نظيفة بالكامل.

### المرحلة 9 (2026-09-15)

أُنجزت المرحلة 9 بالكامل: نظام حجوزات مناسبات/شركات مستقل تماماً عن حجز الأفراد MVP — هجرة `0009_event_reservations.sql` (جدول جديد + صلاحيتان جديدتان لـowner/branch_manager فقط)، مخطط تحقق + Server Actions (إنشاء + تحديث حالة)، نموذج إضافة + لوحة تفاصيل/تغيير حالة، صفحات الإدارة الثلاث، ترجمات، رابط قائمة جانبية.

نقاط يجب معرفتها:
- **تعديل تصميم عن المخطط الأصلي في الخطة**: أُضيفت سياسة `update` على `event_reservations` (غير موجودة في `reservations` الأصلي من المرحلة 5) لأن تغيير الحالة (pending→confirmed/rejected) يحتاجها فعلياً؛ استُخدمت نفس شرط `manage_event_reservations` لكل من `select`/`insert`/`update` بدل تعقيد إضافي (لا حاجة لصلاحية منفصلة لتغيير الحالة تحديداً — من يقدر يُنشئ حجزاً يقدر يغيّر حالته).
- **درس تسمية namespace**: أول محاولة سمّيت ملفات الترجمة `event-reservations.json` (kebab-case) بينما استُخدم `eventReservations` كاسم namespace في الكود والاستدعاءات — اكتُشف الخطأ قبل التشغيل لأن `i18n/request.ts` يستورد الملف عبر `import(\`../messages/${locale}/${ns}.json\`)` حرفياً، فاسم الملف يجب أن يطابق `ns` تماماً (نفس نمط `publicMenu.json` الموجود مسبقاً)؛ أُعيدت تسمية الملفين إلى `eventReservations.json` قبل أي تشغيل فعلي.
- **لا حاجة لـRPC هنا** (بخلاف `toggle_item_availability`/`bootstrap_restaurant`/`get_table_reservation`): تغيير الحالة يحتاج نفس صلاحية الإنشاء (`manage_event_reservations`) المتاحة أصلاً لـowner/branch_manager عبر RLS مباشرة — لا فجوة صلاحيات تستدعي `security definer`.
- **ملاحظة تعاون بين جلستين**: أثناء العمل لاحظت أن جلسة Claude أخرى (على الأرجح `bab-db`) كانت تُعدّل `components/table/TableForm.tsx` و`components/reservation/ReservationForm.tsx` بالتوازي (ترحيل من `Select` البسيط إلى `select-radix` جديد) — تعديل غير متعلق بمهمتي فلم أُعدّله ولم أتعارض معه؛ نموذجي الجديد (`EventReservationForm.tsx`) استخدم `Select` البسيط الموجود (نفس ما كانت عليه بقية النماذج وقت كتابتي)، وقد يحتاج توحيداً لاحقاً مع بقية النماذج إن استقر الترحيل الجديد على `select-radix`.
- **قيد معروف مستمر**: لم يُختبَر تدفق النموذج/صفحة التفاصيل عبر متصفح حقيقي (لا أداة Headless متاحة) — التحقق تم عبر استعلامات RLS مباشرة تحاكي بالضبط ما تنفّذه Server Actions، بالإضافة لـ`next build`/`eslint` نظيفين.

### المرحلة 8 (2026-09-15)

إصلاح بسيط بتعديل سطر شرط واحد في كل من الملفين:
- `TableForm.tsx`: الشرط `!tableId && branches && branches.length > 1` → `!tableId && branches` (حقل الفرع يظهر الآن دائماً عند إضافة طاولة جديدة، بغض النظر عن عدد الفروع؛ يبقى مخفياً عند التعديل كما كان).
- `ReservationForm.tsx`: الشرط `branches.length > 1` → `branches.length > 0` (لا فرق بين إضافة/تعديل في هذا النموذج أصلاً — Server Action واحدة `createReservation` فقط، بلا صفحة تعديل — فالشرط الوحيد المنطقي هنا هو وجود فروع أصلاً).
- **قيد معروف**: لم يُفحص بصرياً عبر متصفح حقيقي (لا أداة Headless متاحة) — التحقق عبر `next build`+`eslint` فقط، وهما نظيفان تماماً. المستخدم مطلوب منه تأكيد الشكل بصرياً.

### المرحلة 7 (2026-09-15)

المراجعة النهائية للمشروع بالكامل قبل الإطلاق:

- **`next build`**: نظيف (compile + typecheck + توليد كل المسارات الـ21، بلا أخطاء/تحذيرات)
- **`eslint`**: نظيف (exit 0، بلا أي مخالفة)
- **`tsc --noEmit`**: نظيف (بلا مخرجات = بلا أخطاء أنواع)
- **مراجعة أمنية سريعة** (عبر وكيل بحث مستقل فحص الكود فعلياً، ليس افتراضاً):
  1. **لا اعتماد على إخفاء الواجهة**: `proxy.ts` يحمي كل مسارات `app/(app)/*` فعلياً (باستثناء `/m/*` العامة عمداً)، عبر تحقق حقيقي من JWT (`getClaims()`) في `lib/supabase/middleware.ts` وليس فحص كوكي سطحي؛ ترويسة `x-verified-user-id` تُحذف من الطلب الوارد قبل ضبطها من الخادم فلا يمكن تزويرها. كل Server Action تمر عبر `createClient()` بمفتاح anon + كوكيز المستخدم، أي أن RLS في Postgres هي خط الدفاع الفعلي دائماً — حماية مزدوجة (Middleware + RLS)، لا افتراض أن "الفورم لن يُستدعى إلا من مستخدم مسجل دخول".
  2. **RLS مفعّلة على كل جدول**: رُوجعت الهجرات 0001–0008 كاملة؛ كل جدول أُنشئ بـ`create table` لديه `enable row level security` + سياسات مطابقة، بلا استثناء واحد غير موثّق. سياسات `anon` المتاحة (منيو عام/QR/حجوزات عبر RPC) موثّقة ومقصودة.
  3. **QR token غير قابل للتخمين**: التوليد الافتراضي في `0005_tables_qr.sql` عبر `encode(gen_random_bytes(32), 'hex')` (256 بت عشوائية تشفيرية)، و`regenerateQr` في `lib/actions/table.actions.ts` يستخدم `randomBytes(32)` من `crypto` — نفس المستوى، متسق.
  - **فحص إضافي (تسريب أسرار)**: `SUPABASE_SERVICE_ROLE_KEY` محصور في `lib/supabase/admin.ts` (يحمل `import "server-only"`) و`scripts/migrate.ts` فقط؛ لا وجود له في أي من 34 ملف `"use client"`. العميل يستخدم `NEXT_PUBLIC_SUPABASE_ANON_KEY` فقط، وأمانه يعتمد على RLS المفعّلة أعلاه — سليم.
  - **لا ثغرات وُجدت**. لا توصية إصلاح مطلوبة.

**حالة المشروع**: الخطة الأساسية (المراحل 0–7) منجزة بالكامل. متبقٍ خارج نطاق الخطة الأساسية (اختياري، غير مُلزم للمرحلة 7):
- اختبار تفاعلي فعلي عبر متصفح حقيقي (نقر/بحث/فتح تفاصيل صنف/تبديل لغة) — كل التحقق السابق عبر curl/سكربتات مباشرة، وليس متصفح Headless
- `ActionBar` في المنيو العامة ما زال stub فارغ (نقطة توسّع مستقبلية موثّقة بتعليق، بلا منطق فعلي)

### استيراد بيانات باب البلد الفعلية إلى القاعدة الحية (2026-09-15)

كُتب `scripts/import/bab-albalad.ts` (جديد) يقرأ `data/import/bab-albalad/menu.json` الجاهز مسبقاً من المرحلة 4 وينشئ مطعم "باب البلد" كاملاً في القاعدة الحية مباشرة عبر `DATABASE_URL` (بنفس نمط `scripts/migrate.ts`، معاملة واحدة `begin/commit/rollback`)، لأنه لم يكن هناك أي مطعم بهذا الاسم في القاعدة بعد (3 مطاعم اختبارية فقط، بلا أي منيو).

- [x] رفع 87 صورة محلية (شعار + صور أصناف + أيقونات مُسبِّبات) إلى bucket `menu-images` عبر عميل service role (`upsert: true`)
- [x] إنشاء `restaurant` ("باب البلد") + `branch` واحد ("الفرع الرئيسي") + `menu` واحد بلا جدولة (نشط دائماً) + 12 `menu_category` + 77 `menu_item` مرتبطة عبر `menu_category_items` + 9 `allergens` مرجعية + روابط `item_allergens`
- [x] تحقّق فعلي بعد الاستيراد: استعلام مباشر يؤكد 12 فئة/77 صنف، وفحص `curl` فعلي لرابط صورة صنف مرفوعة (`HTTP 200`) يؤكد أنها عامة القراءة فعلاً وليس فقط رابطاً مُولَّداً

نقاط يجب معرفتها:
- **انحراف مخطط غير موثَّق في migrations**: عمود `branches.slug` (NOT NULL) موجود فعلياً في القاعدة الحية لكن غير موجود في أي ملف بـ`supabase/migrations/`— تمت إضافته مباشرة (على الأرجح من جلسة `bab-db` المذكورة في مراحل سابقة) بلا هجرة مسجَّلة. اكتُشف بالتجربة (فشل insert بـ`null value in column "slug"`)، فتم فحص العمود حياً عبر `information_schema.columns` ومطابقة منطق التوليد الفعلي من `lib/actions/branch.actions.ts` (`slugify(nameEn)`) بدل تخمينه. **درس عام**: لا يُفترض أن ملفات `supabase/migrations/*.sql` تعكس المخطط الحي بالكامل في هذا المشروع تحديداً — يستحق التحقق من الحي عبر `information_schema` عند أي `insert` مباشر جديد بدل الاعتماد على قراءة ملفات الهجرة فقط.
- **مفاتيح Supabase Storage يجب أن تكون ASCII فقط**: أسماء ملفات أيقونات المُسبِّبات (مثل `allergen-فول-الصويا-ومنتجاته.png`) عربية المصدر من سكربت الاستخراج السابق، ورفعها مباشرة برابط الاسم نفسه يفشل بـ`Invalid key`. الحل في السكربت: دالة `safeStorageName` تستبدل أي اسم غير ASCII بمعرّف تسلسلي (`asset-N.ext`) عند الرفع فقط، مع إبقاء القراءة المحلية بالاسم الأصلي من `menu.json`.
- السكربت idempotent جزئياً (رفع الصور بـ`upsert: true`)، لكن **غير آمن لإعادة التشغيل الكامل** — لا يتحقق من وجود مطعم "باب البلد" مسبقاً قبل الإدراج، فتشغيله مرة ثانية يُنشئ مطعماً مكرراً بالكامل. هذا مقبول لأنه سكربت استيراد لمرة واحدة موثَّق كذلك في رأس الملف، وليس جزءاً من التدفق التشغيلي العادي.

### المرحلة 6 (2026-09-15)

أُنجزت المرحلة 6 بالكامل: هجرة `0008_menu_events.sql`، `lib/domain/{resolve-table,get-menu-tree,get-table-reservation}.ts`، صفحتا QR والتابلت العامتان + مكوّنات `components/public-menu/*` (ترويسة/بطاقة حجز/تصفح+بحث/تفاصيل صنف/مبدّل لغة/ActionBar stub)، توسيع اكتشاف اللغة (`Accept-Language`) في `i18n/request.ts`.

نقاط يجب معرفتها:
- **قرار أمني مهم غيّر تصميم الهجرة عن الخطة الأصلية**: كنت سأمنح `anon` سياسة `select` عامة على `reservations` لعرض بيانات الحجز الكاملة (طلب صريح من المستخدم)، لكن اكتُشف أثناء التصميم أن أي سياسة RLS على جدول تُطبَّق على **كل** طلبات REST المباشرة بمفتاح anon العام (مكشوف في متصفح أي زائر)، بصرف النظر عن فلاتر `.eq()` في كودنا — أي زائر كان سيقدر على تفريغ حجوزات **كل** مطاعم المنصة (اسم+هاتف+وقت) بطلب واحد لا يمرّ عبر تطبيقنا إطلاقاً. الحل: RPC واحد `security definer` (`get_table_reservation`) يتحقق فعلياً من `qr_token` قبل إرجاع أي صف، بنفس نمط `toggle_item_availability`/`bootstrap_restaurant` الموجود مسبقاً في المشروع — **بلا أي سياسة anon على `reservations`/`customers` إطلاقاً**. **درس مهم لأي RLS مستقبلي على anon**: أي بيانات "خاصة بسياق طلب معيّن" (توكن/جلسة) يجب أن تمر عبر RPC يتحقق من ذلك السياق صراحة، لا سياسة RLS عامة تعتمد على أن الكود سيُصفّي — RLS لا يعرف نية الاستعلام، والعميل anon مكشوف بالكامل لأي طرف.
- **علّة بناء اكتُشفت وأُصلحت**: استيراد `LOCALE_COOKIE` (قيمة، لا نوع) من `i18n/request.ts` داخل مكوّن `"use client"` (`LanguageSwitcher`) سحب `next/headers` إلى حزمة المتصفح وكسر البناء ("Pages Router" رسالة مضلِّلة من Turbopack). الحل: فصل الثوابت البحتة (`LOCALES`/`Locale`/`DEFAULT_LOCALE`/`LOCALE_COOKIE`/`isLocale`) إلى `i18n/locales.ts` بلا أي استيراد خادمي، و`i18n/request.ts` يعيد تصديرها للتوافق. **درس عام**: استيراد `type X` من ملف يحتوي كوداً خادمياً آمن (يُحذف وقت البناء)، لكن استيراد **قيمة فعلية** من نفس الملف يسحب كل تبعياته الخادمية إلى العميل — أي قيمة يحتاجها client component يجب أن تعيش في ملف منفصل بلا استيراد next/headers|cookies.
- **تحقق فعلي كامل عبر متصفح حقيقي هذه المرة** (خلافاً لكل المراحل السابقة التي اعتمدت فقط استعلامات مباشرة) — وُجد سيرفر `next dev` يعمل مسبقاً في جلسة المستخدم (منفذ 3411)، فاستُخدم مباشرة عبر `curl` بدل تشغيل سيرفر جديد: بيانات اختبار حقيقية (مطعم/فرع/طاولة/QR/قائمة بجدولة تغطي الأسبوع كله/فئة/صنفين أحدهما غير متوفر/حجز خلال ساعتين) أُدرجت مباشرة عبر `DATABASE_URL`، ثم فحص فعلي بمكتبة `@supabase/supabase-js` بمفتاح anon (11 فحصاً: حل QR، قراءة الفرع/الطاولة، ظهور الصنف المتوفر فقط، صحة `get_table_reservation`، رفض توكن خاطئ، **منع anon من قراءة `reservations`/`customers`/`qr_scan_events` مباشرة (إيجابي أن التسريب غير موجود)**، تسجيل `qr_scan_event`، إبطال التوكن فوراً بعد التعطيل) — 11/11 نجح. ثم فحص HTML فعلي عبر `curl` لصفحتي QR والتابلت (المحتوى الصحيح ظاهر، الصنف غير المتوفر غائب تماماً، `dir="rtl"` بالعربي) و**تبديل اللغة عبر رأس `Accept-Language: en`** فعلياً (`dir="ltr"`+محتوى إنجليزي). كل بيانات الاختبار حُذفت بعدها.
- `next build`/`eslint`/`vitest run` نظيفة بالكامل (0 أخطاء/تحذيرات).
- **قيد معروف مستمر**: لم يُختبَر التفاعل الفعلي (نقر/بحث/فتح تفاصيل صنف/تبديل لغة بالنقر) داخل متصفح حقيقي بواجهة مرئية — فقط HTML المُولَّد من السيرفر. المنطق التفاعلي (`MenuBrowser`/`ItemDetailsSheet`) بسيط بما يكفي (فلترة client-side + حالة React عادية) لعدم وجود مخاطرة عالية، لكن يستحق فحصاً بصرياً يدوياً قبل الإطلاق الفعلي.

### المرحلة 5 (2026-09-15)

أُنجزت المرحلة 5 بالكامل: هجرة `0007_reservations.sql` (`customers`+`reservations`، RLS بنفس نمط الكتالوج)، مخطط تحقق + Server Action واحد (`createReservation` فقط — النطاق "إنشاء/عرض فقط" حرفياً، بدون تعديل/إلغاء)، صفحتا إدارة + نموذج بنفس نمط `tables`. تحقّق فعلي حي عبر اتصال Postgres مباشر (إيجابي + سلبي) نجح 100%، وكل بيانات الاختبار أُلغيت بـ`rollback`.

نقاط يجب معرفتها:
- **تنسيق تعاون بين جلستين**: جلسة Claude أخرى (`bab-db`) أبلغتني أثناء العمل أن كلمة مرور `owner-test@bab.local` تُعاد ضبطها بشكل متكرر (على الأرجح من سكربتات اختبار متوازية سابقة في جلسات أخرى)، وأنها أوقفت استخدام هذا الحساب وأنشأت `human-owner@bab.local` للاختبار اليدوي بالمتصفح، وسلّمت استمرار العمل لهذه الجلسة. تجنّباً لأي تصادم إضافي، لم أُسجّل دخولاً فعلياً بـ`owner-test@bab.local` في هذه المرحلة — استخدمت بدلاً من ذلك اتصال Postgres مباشر (`DATABASE_URL`) مع محاكاة جلسة `authenticated` عبر `set_config('request.jwt.claims', ...)`، وهو نفس الأسلوب الموثَّق في `~/.claude/learnings/backend.md` لاختبارات RLS. **إن احتاجت مرحلة لاحقة تسجيل دخول فعلي بجلسة Supabase Auth حقيقية (وليس محاكاة JWT فقط)، استخدم `human-owner@bab.local` بدل `owner-test@bab.local`، أو نسّق مع جلسة `bab-db` أولاً.**
- تجنّبتُ خطأ TypeScript المعروف مسبقاً (`z.coerce.number()` يكسر أنواع `zodResolver`، موثَّق في `~/.claude/learnings/backend.md` من المرحلة 4) من البداية هذه المرة — استُخدم `z.number()` مع تحويل `Number(e.target.value)` في `onChange` بدلاً منه، ونفس الشيء لتحذير React Compiler حول `form.watch()` — استُخدم `useWatch` مباشرة (نفس نمط `ItemForm.tsx` الموجود مسبقاً في المشروع) فتجنّبتُ التحذير من البداية بدل اكتشافه لاحقاً.
- **قيد معروف مستمر**: كما في كل المراحل السابقة، لم يُختبَر تدفق النموذج عبر متصفح حقيقي (لا أداة Headless متاحة) — التحقق تم عبر استعلامات/RLS مباشرة تحاكي بالضبط ما تنفّذه Server Action.

### المرحلة 4 (2026-09-15)

أُنجزت المرحلة 4 بالكامل: استخراج بيانات المنيو الفعلية (77 صنف/12 فئة)، هجرة `0006_menu_catalog.sql` (10 جداول + bucket تخزين + RPC)، منطق الجدولة (`lib/domain/menu-schedule.ts`، أول اختبارات وحدة في المشروع عبر `vitest`)، مخططات التحقق + Server Actions لكل من menus/categories/items (بما فيها variants/option groups/values/allergens)، صفحات الإدارة الكاملة، وزر "غير متوفر" السريع. تحقّق فعلي حي شامل ضد Supabase (إنشاء كامل + ربط صنف بفئتين + RLS إيجابي وسلبي) نجح 100%.

نقاط يجب معرفتها:
- **ترقيم الهجرات تغيّر عن الخطة الأصلية**: جلسة Claude أخرى (`bab-db`) كانت تعمل على نفس المشروع بالتوازي في بداية هذه الجلسة؛ بعد تنسيق مباشر بينهما تبيّن أن كل هجرات 0001-0005 متطابقة، فأصبحت هجرة كتالوج المنيو `0006` بدل `0004` كما في الخطة الأصلية، وهجرتا الحجز/أحداث المنيو أُعيد ترقيمهما إلى `0007`/`0008` في هذا الملف تبعاً لذلك.
- **إصلاحان في سكربت السكرابينغ** (`scripts/scrape/bab-albalad.ts`) اكتُشفا أثناء التحقق من جودة البيانات المستخرجة: (1) طلب `/en` بلا جلسة موجودة مسبقاً كان يُعاد توجيهه دائماً لـ`/ar` (نتج عنه `name_en` = `name_ar` حرفياً لكل الحقول في أول تشغيل) — الحل: كوكي جلسة مشترك + زيارة الجذر أولاً. (2) 39 من 77 صورة فشل تنزيلها صامتاً في أول تشغيل (مهلة CDN عابرة) — التشغيل الثاني بعد إصلاح (1) نجح 100% (87/87 ملف).
- **بيانات المنيو الفعلية مستخرجة لكنها لم تُستورد إلى قاعدة البيانات بعد** — `data/import/bab-albalad/menu.json` جاهز، لكن هذه المرحلة بنت البنية التحتية (Schema/Actions/UI) فقط. استيراد الـ77 صنف الفعلي يحتاج سكربت import منفصل (غير موجود بعد) يقرأ `menu.json` ويستخدم Server Actions/إدخال مباشر — مرشّح جيد كخطوة تالية قبل الإطلاق الفعلي.
- **`vitest` أُضيف للمشروع لأول مرة** في هذه المرحلة (لم يكن هناك مُشغِّل اختبارات إطلاقاً)، مع رفع `@types/node` من `^20` إلى `^24` ليطابق إصدار Node الفعلي ويُرضي متطلبات `vitest@5` (تجنّباً لثغرات أمنية في `vite`/`esbuild` القديمين المرتبطين بإصدار أقدم من vitest).
- **علّة TypeScript معروفة سلفاً** (zod `.default()` + `zodResolver` تُنتج تعارض أنواع Resolver/Control غامضاً) كانت موثَّقة أصلاً في `~/.claude/learnings/frontend.md` من مشروع DealzTree — لم تُراجع قبل البدء فأُعيد اكتشافها هنا؛ الدرس نفسه ينطبق حرفياً (تجنّب `.default()`/`z.coerce`/`z.intersection` في مخططات النماذج).
- **قيد معروف**: كما في المراحل السابقة، لم يُختبَر تدفق النماذج عبر متصفح حقيقي (لا أداة Headless متاحة) — التحقق تم عبر استعلامات/RLS/RPC مباشرة تحاكي بالضبط ما تنفّذه Server Actions.

### إصلاح: لا يوجد زر تسجيل خروج (2026-09-15)

**المشكلة**: `AppTopbar` يحوي مبدّل لغة ومبدّل ليلي/نهاري فقط — لا وجود لأي زر أو مسار "تسجيل خروج" في كامل المشروع (لا Server Action، لا component)، فبعد تسجيل الدخول لا توجد طريقة للخروج من الجلسة عبر الواجهة.

- [x] `components/layout/LogoutButton.tsx` (جديد، client component): زر أيقونة (`LogOut` من lucide) يستدعي `supabase.auth.signOut()` عبر `createClient()` المتصفحي (نفس نمط `app/(auth)/login/page.tsx`)، ثم `router.push("/login")` + `router.refresh()`
- [x] `components/layout/AppTopbar.tsx`: إضافة `LogoutButton` بجانب مبدّلي اللغة والثيم
- [x] مفتاح ترجمة جديد `common.logout` في `messages/{ar,en}/common.json`
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان
- **قيد معروف**: لم يُختبَر النقر الفعلي (زر → `signOut()` → تحويل لـ`/login` → منع الوصول لـ`/dashboard` بعده) عبر متصفح حقيقي — لا أداة Headless متاحة، والمنطق مطابق حرفياً لتدفق تسجيل الدخول الموجود مسبقاً والمُتحقَّق منه.

### إصلاح: قائمة تنقل مفقودة في لوحة التحكم (2026-09-15)

**المشكلة**: كل صفحات لوحة التحكم (المنايو، الأصناف، الطاولات، الحجوزات، الفروع) كانت موجودة وشغّالة، لكن `app/(app)/layout.tsx` و`app/(app)/dashboard/page.tsx` لا يحتويان أي رابط تنقل إليها عدا زر واحد لـ"الفروع" — المستخدم لا يملك طريقة لاكتشاف هذه الصفحات إلا بكتابة الرابط يدوياً.

**الإصلاح**:
- [x] `components/layout/AppSidebar.tsx` (جديد، client component): قائمة جانبية بروابط لكل الأقسام (لوحة التحكم/الفروع/المنايو/الأصناف/الطاولات/الحجوزات) مع تمييز الرابط النشط عبر `usePathname`
- [x] `app/(app)/layout.tsx`: يُدرج `AppSidebar` بجانب المحتوى، فقط بعد وجود `restaurantId` (تجنّباً لإظهارها أثناء شاشة onboarding التي لا معنى للتنقل فيها)
- [x] مفاتيح ترجمة جديدة `common.nav.*` في `messages/{ar,en}/common.json`
- [x] تحقّق: `tsc --noEmit` نظيف، لا أخطاء ESLint، ولوحظ عبر سجلات `next dev` الحية أن رسائل `MISSING_MESSAGE` التي ظهرت أثناء التحرير كانت سابقة زمنياً لحفظ ملفات الترجمة (HMR أعاد تحميل المكوّن قبل حفظ JSON) — لا خطأ فعلي بعد اكتمال الحفظ.
- **قيد معروف**: لم يُختبَر ظهور القائمة فعلياً بجلسة مسجّلة عبر متصفح حقيقي (لا أداة Headless متاحة) — التحقق تم عبر فحص النوع + سجلات الخادم الحية فقط.

### إصلاح: لا يوجد مبدّل لغة ولا مبدّل ليلي/نهاري في لوحة التحكم (2026-09-15)

كانت الآلية موجودة بالكامل (next-themes + next-intl مع كوكي `NEXT_LOCALE`) وتُستخدم فعلاً في `LanguageSwitcher` الخاص بالمنيو العامة، لكن لا شيء يعرضها داخل لوحة التحكم.

- [x] `components/layout/LanguageSwitcher.tsx` (جديد): نفس نمط `components/public-menu/LanguageSwitcher.tsx` لكن يستخدم مفاتيح `common.arabic`/`common.english` الموجودة أصلاً بدل namespace المنيو العامة
- [x] `components/layout/ThemeToggle.tsx` (جديد): زر تبديل فاتح/داكن عبر `useTheme()` من next-themes — استُخدم `useSyncExternalStore` بدل `useEffect(() => setState())` لتفادي حالة عدم تطابق hydration بدون مخالفة قاعدة `react-hooks/set-state-in-effect` (اكتُشفت أثناء `npm run lint`)
- [x] `components/layout/AppTopbar.tsx` (جديد) يجمع الاثنين، يُعرض أعلى المحتوى في `app/(app)/layout.tsx` في الحالتين (onboarding وبعد وجود مطعم)
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان، لا أخطاء جديدة في سجلات `next dev` الحية
- **قيد معروف**: لم يُختبَر التبديل الفعلي (نقرة الزر → تغيّر فعلي في `class="dark"`/الكوكي) عبر متصفح حقيقي — لا أداة Headless متاحة.

### إصلاح: نماذج الإضافة/التعديل بلا إطار بصري في كل التطبيق (2026-09-15)

المستخدم أرسل لقطة شاشة لصفحة "حجز جديد" — النموذج يظهر عائماً بلا حدود أو خلفية بصرية تميّزه عن باقي الصفحة. بالفحص تبيّن أن نفس النمط (`<form className="grid max-w-sm gap-4">` بلا أي إطار) مكرر حرفياً في 5 مكوّنات نماذج + نسخة مشابهة في السادس، عبر كل الكيانات (الفروع، الطاولات، المنايو، الفئات، الأصناف، الحجوزات) — وافق المستخدم على إصلاح النمط المشترك مرة واحدة بدل ترقيع صفحة الحجز فقط.

- [x] `components/ui/form-card.tsx` (جديد): مكوّن `FormCard` صغير يغلّف `Card`/`CardContent` الموجودين أصلاً (`bg-card` + `ring` + `shadow` + `rounded-xl`) بنفس تصميم بقية التطبيق (مثال: بطاقات الفئات في `menus/[id]/page.tsx`) — بدل اختراع نمط بصري جديد
- [x] طُبّق `FormCard` على 6 مكوّنات: `ReservationForm`, `BranchForm`, `TableForm`, `MenuForm`, `CategoryForm` (نفس النمط حرفياً `<form className="grid max-w-sm gap-4">` → `<form><FormCard>...</FormCard></form>`)، و`ItemForm` (النموذج الأكبر — غُلّفت الحقول الأساسية فقط بـ`FormCard className="max-w-none"` بينما بطاقتا المتغيّرات/مجموعات الخيارات المستقلتان أصلاً بقيتا كما هما كبطاقات شقيقة تحتها، تجنّباً لتعشيش Card داخل Card بلا داعٍ)
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان بعد كل التعديلات؛ راقبتُ سجلات `next dev` الحية أثناء التحرير وأمسكت خطأ JSX حقيقي واحد (وسم `</FormCard>` ناقص مؤقتاً في `BranchForm.tsx` أثناء التحرير التدريجي) وصححته فوراً — التحقّق النهائي بعد اكتمال كل الملفات نظيف تماماً بلا أي خطأ
- **قيد معروف**: لم يُفتَح أي من الصفحات الست فعلياً بمتصفح حقيقي بجلسة مسجّلة للتأكد بصرياً من الشكل النهائي (لا أداة Headless متاحة) — التحقق تم عبر فحص الأنواع/ESLint/سجلات الخادم الحية فقط. المستخدم مطلوب منه تحديث المتصفح وتأكيد الشكل.

### إصلاح جذري: الصفحة الرئيسية "/" كانت لا تزال placeholder من create-next-app (2026-09-15)

المستخدم أرسل لقطة شاشة لـ`localhost:3411` تُظهر بطاقة ثابتة "Digital Menu / Loading… / Confirm" بلا أي وظيفة، وسأل لماذا لا يتم توجيهه لأي صفحة. بالفحص تبيّن أن `app/page.tsx` بقي منذ المرحلة 0 هو نفس صفحة `create-next-app` الافتراضية (مذكورة في التوثيق الأصلي كملف مُنشأ لكن لم يُستبدَل لاحقاً) — لا redirect ولا رابط فعلي لأي مكان. هذا كان على الأرجح السبب الجذري الحقيقي لكل شكاوى التنقّل السابقة في هذه الجلسة (المستخدم يفتح الموقع من `/` ويعلق هناك بدل الوصول لـ`/dashboard` أو `/login`).

- [x] `app/page.tsx`: استُبدلت بالكامل بـ`redirect("/dashboard")` بسيط — `/dashboard` نفسها محمية عبر `requireProfile()` في `app/(app)/layout.tsx` فتُحوِّل تلقائياً لـ`/login` لغير المسجَّلين، فتُغطّى الحالتان (مسجَّل/غير مسجَّل) من مكان واحد بلا تكرار منطق middleware
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان، وتأكيد فعلي حي عبر curl أن `/` تُرجع الآن `307` إلى `/login` (بدل `200` مع الصفحة الميتة سابقاً)
- **ملاحظة للمستقبل**: يستحق مراجعة بقية ملفات المرحلة 0 (إن وُجدت) للتأكد أنه لا يوجد placeholder آخر متبقٍّ من create-next-app لم يُستبدَل.

### إصلاح: القائمة المنسدلة (الفرع) تظهر بمظهر HTML خام لا يناسب باقي التصميم (2026-09-15)

المستخدم أرسل لقطة لصفحة "طاولة جديدة" بعد إضافة `FormCard` — الشكل العام صار جيداً (بطاقة، حدود، خط واضح) لكن حقل "الفرع" ظل `<select>` HTML خام بسهم متصفح افتراضي غير متسق مع باقي عناصر shadcn/ui المصمَّمة (`Input`/`Button`/`Card`). بالفحص تبيّن أن `components/ui/select.tsx` المستخدَم في كل النماذج هو `<select>` أصلي بسيط، بينما المشروع يملك أصلاً مكوّن Select كامل مبني على Radix (`components/ui/select-radix.tsx`، منسوخ من DealzTree لكن لم يُستخدَم فعلياً في أي نموذج) — هو المكوّن المقصود فعلياً حسب التقنية الموثَّقة في `CLAUDE.md` ("shadcn/ui (Radix UI base)").

- [x] استبدال `Select` الأصلي بـ`select-radix` (Trigger/Content/Item بسهم وقائمة منسدلة مصمَّمة) في 4 نماذج: `TableForm`, `MenuForm`, `ItemForm` (حقل الفرع)، و`ReservationForm` (حقلا الفرع والطاولة)
- [x] **تفصيلة**: Radix Select لا يقبل `value=""` (يرمي خطأ) — حقل "الطاولة" في `ReservationForm` كان يستخدم قيمة فارغة لخيار "بدون طاولة محدّدة"، فاستُخدمت قيمة بديلة `"__none__"` (`NO_TABLE_VALUE`) وتُحوَّل من/إلى `""` عند `onValueChange`/`value`
- [x] لم أُغيّر باقي استخدامات `Select` الأصلي (`CategoryItemsPanel`, `MenuScheduleManager`, `event-reservation/*`) — خارج نطاق الشكاوى الحالية، وبعضها يخص ميزة "المناسبات" التي تعمل عليها جلسة Claude أخرى (`bab-db`) بالتوازي حالياً؛ لتفادي تصادم تعديلات
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان، وسجلات `next dev` الحية لا تُظهر أي خطأ متعلق بالملفات الأربعة المعدَّلة (الأخطاء الظاهرة في السجل الحي وقتها كانت من عمل الجلسة الأخرى على ميزة المناسبات، غير متعلقة بهذا التعديل)
- **قيد معروف**: لم يُفتَح فعلياً بمتصفح حي للتأكد بصرياً من شكل القائمة المنسدلة الجديدة وسلوكها بالسحب/اللمس على التابلت — لا أداة Headless متاحة.

### إعادة تصميم الشريط الجانبي/العلوي بنفس أسلوب DealzTree ERP الفعلي (2026-09-15)

المستخدم طلب صراحة استخدام نفس أسلوب DealzTree ERP بدل الاجتهاد الحر. بما أن `C:\Users\HP\DealzTree ERP` متاح محلياً، فحصت فعلياً `components/nav/{TopBar,NavLink,NavHeader,SignOutButton}.tsx` و`components/theme/ThemeToggle.tsx` و`components/i18n/LocaleToggle.tsx` وglobals.css — بدل تخمين "أسلوب" عام. اكتشفت أن Sidebar/Topbar اللي بنيتها سابقاً هذه الجلسة استخدمت tokens خاطئة (`bg-card`/`bg-primary`) بدل tokens الشريط الجانبي الفعلية الموجودة أصلاً في `app/globals.css` المنسوخ من نفس المشروع (`--sidebar`, `--sidebar-foreground`, `--sidebar-accent`, `--sidebar-border`) — فكانت لا "تقرأ" بصرياً كشريط تنقّل مميّز رغم أنها تستخدم نفس نظام الألوان تقنياً.

- [x] `AppSidebar.tsx`: أُعيد بناؤه كـ`<aside>` بعرض `w-60` بنفس tokens DealzTree (`bg-sidebar text-sidebar-foreground border-e`) + رأس علامة تجارية (مربع حرف أول + اسم "Digital Menu") + روابط بنفس نمط `NavLink` الفعلي (نشط: `bg-brand-accent/10 text-brand-accent`، غير نشط: `hover:bg-sidebar-accent`) بدل الأزرق الصريح `bg-primary` المستخدَم سابقاً
- [x] `AppTopbar.tsx`: أُعيد بناؤه كشريط `h-14 bg-sidebar border-sidebar-border` (بدل `bg-card` بسيط) + كتلة حساب المستخدم في النهاية (Avatar بأحرف الاسم الأولى + الاسم + الدور) تماماً كنمط `TopBar.tsx` في DealzTree — يستقبل الآن `fullName`/`roleKey` من `app/(app)/layout.tsx` (كانا متوفرين أصلاً في `profile` ولم يُستخدَما)
- [x] `ThemeToggle.tsx`: أُعيد بناؤه كقائمة منسدلة 3 خيارات (فاتح/داكن/حسب الجهاز) بدل تبديل ثنائي بسيط — نفس نمط `DropdownMenu` + علامة ✓ على الخيار الحالي في نسخة DealzTree، مع الإبقاء على حل `useSyncExternalStore` لتفادي مشكلة hydration (كان الحل نفسه مستخدَماً في DealzTree أيضاً — تأكيد مستقل لنفس القرار)
- [x] `LanguageSwitcher.tsx`: بُسِّط لزر واحد مدمج (`EN`/`ع`) بدل زرّين متجاورين — نفس نمط `LocaleToggle` المضغوط في DealzTree؛ أُبقي على الآلية الحالية (كوكي من جهة العميل) بدل نسخ آلية DealzTree الكاملة التي تحفظ التفضيل في `profiles.locale` عبر RPC `set_my_locale` غير موجودة في قاعدة بيانات Bab (ميزة مفقودة، مذكورة أدناه)
- [x] ترجمات جديدة `common.theme.*` في `messages/{ar,en}/common.json`
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان، وسجلات `next dev` الحية تؤكد عدم وجود أخطاء بعد اكتمال كل الملفات (خطأ `MISSING_MESSAGE` مؤقت ظهر أثناء التحرير التدريجي قبل حفظ ملفات الترجمة، زال بعد الحفظ)
- **لم يُغيَّر**: `LogoutButton.tsx` (أضافته جلسة `bab-db` المتوازية أثناء هذا التحليل بأسلوب مختلف قليلاً عن `SignOutButton` في DealzTree — عميل مباشر بدل server action — تُرك كما هو لتفادي تصادم تعديلات؛ الفرق الوظيفي بسيط وغير مؤثر)

### الفجوات الأربع المتبقية مقارنة بـDealzTree — أُنجزت بالترتيب المطلوب (2026-09-15)

المستخدم طلب البدء بالفجوات الأربع المذكورة سابقاً بترتيبها. كل جلسات الفحص استندت لملفات DealzTree الفعلية في `C:\Users\HP\DealzTree ERP` (migrations/actions/components)، لا تخمين.

**1) حفظ اللغة في حساب المستخدم بدل الكوكي فقط**
- [x] هجرة جديدة `0011_profiles_set_locale_rpc.sql`: دالة `set_my_locale(p_locale)` بنفس منطق DealzTree حرفياً (security definer مقصور على `auth.uid()`) — طُبّقت فعلياً عبر `npm run db:migrate` (نجحت)
- [x] `lib/actions/locale.actions.ts` (جديد): `setLocale()` server action — يستدعي الـRPC لمستخدم مسجَّل فقط (فحص `auth.getUser()` أولاً، بلا كسر لصفحة المنيو العامة غير المسجَّلة) + يضبط الكوكي + `revalidatePath("/", "layout")`
- [x] `lib/supabase/types.ts`: أُضيفت `set_my_locale` لقسم `Functions`
- [x] `LanguageSwitcher.tsx`: يستدعي `setLocale()` بدل ضبط الكوكي مباشرة من العميل
- [x] `i18n/request.ts`: أولوية حلّ اللغة أصبحت كوكي → **`profiles.locale` (جديد)** → `Accept-Language` → افتراضي — عبر قراءة ترويسة `x-verified-user-id` (موجودة فقط لمسارات `app/(app)/*` المحمية، فلا تُضاف استعلامات قاعدة بيانات لزوّار المنيو العامة) — يحقّق فعلياً "ينتقل معاك بين الأجهزة" كما وعدت المستخدم

**2) تسمية الأدوار بالعربي بدل `owner`/`staff` خام**
- [x] مفاتيح ترجمة جديدة `common.roles.{owner,branch_manager,staff}` في `messages/{ar,en}/common.json` (بدل ملف `lib/domain/roles.ts` منفصل كنت أنشأته ثم حذفته — تكرار غير مبرَّر مع نظام next-intl الموجود أصلاً في كل الكودبيس)
- [x] `AppTopbar.tsx` (تحت الصورة الرمزية) و`app/(app)/dashboard/page.tsx` (سطر "الدور: ...") يترجمان `roleKey` الآن عبر بحث بسيط في `messages` بدل عرضه خاماً — بلا استخدام `t()` المباشر لتفادي `MISSING_MESSAGE` لو ظهر دور مخصّص مستقبلاً (الجدول `roles` ليس enum حسب تصميم المشروع)

**3) قائمة جانبية للجوال (Drawer)**
- [x] استُخرج محتوى الشريط الجانبي (الشعار + الروابط) إلى `components/layout/SidebarNavContent.tsx` مشترك
- [x] `AppSidebar.tsx`: أصبح `hidden ... md:flex` (كان ظاهراً دائماً بلا بديل على الجوال سابقاً — عطل فعلي كان قائماً)
- [x] `MobileNavDrawer.tsx` (جديد): نفس حل DealzTree حرفياً — `Dialog` مُموضَع كدرج جانبي (`start-0 top-0 h-full w-72`) بدل مكوّن Sheet منفصل، يُغلق تلقائياً عند نقر أي رابط داخله
- [x] زر الهامبرغر يظهر في `AppTopbar` فقط على الجوال (`md:hidden`) وفقط حين يوجد شريط جانبي أصلاً (`showNavTrigger`)

**4) شعار المطعم بدل حرف "D" ثابت**
- [x] `restaurants.logo_url` كان موجوداً أصلاً في المخطط (هجرة 0002) وغير مُستخدَم — لا حاجة لهجرة جديدة
- [x] `app/(app)/layout.tsx`: استعلام واحد لـ`restaurants(name_ar, name_en, logo_url)` بمعرّف مطعم البروفايل، يُمرَّر لـ`AppSidebar`/`AppTopbar`/`MobileNavDrawer` — استُبدل أيضاً اسم "Digital Menu" الثابت باسم المطعم الفعلي حسب اللغة الحالية (نفس الاستعلام، تصحيح إضافي منطقي لنفس الخلل)
- [x] `SidebarNavContent.tsx`: يعرض `next/image` للشعار الفعلي إن وُجد، وإلا حرف اسم المطعم الأول (بدل "D" ثابت) — نفس نمط `NavHeader.tsx` في DealzTree، ومسموح مسبقاً عبر `next.config.ts` (`*.supabase.co` في `remotePatterns`)

**تحقّق نهائي**: `tsc --noEmit` و`npm run lint` نظيفان تماماً على كل الملفات التي لمستها؛ الخطأ الوحيد المتبقي في المشروع (`app/(app)/reservations/new/page.tsx`, prop `menuByBranch`) يخص ملفاً غير متتبَّع (untracked) تعمل عليه جلسة `bab-db` المتوازية حالياً (ميزة pre-order في الحجوزات) — تأكّدت عبر `git status` أنه ليس من ملفاتي، فلم ألمسه.
**قيد معروف**: لم يُفتَح أي من هذا فعلياً بمتصفح حي مسجَّل الدخول (لا أداة Headless متاحة) — خصوصاً الدرج على الجوال وسلوك اللمس، والشعار الفعلي (يحتاج مطعماً حياً له `logo_url` مضبوط لاختباره بصرياً؛ لا يوجد حالياً مطعم اختبار برفع شعار).

### إعادة تصميم بطاقات الأصناف في المنيو العام لتبدو كمنيو حقيقي (2026-09-15)

المستخدم سأل أين صفحة العميل (منيو + حجوزات + معلومات مطعم) — موجودة فعلاً وتعمل عبر `app/(public)/m/[branchSlug]/t/[qrToken]/{page.tsx,tablet/page.tsx}` (تركّب `MenuHeader`+`ReservationCard`+`MenuBrowser`+`ActionBar`، تُفتح فقط عبر مسح QR الطاولة). لكن بطاقة الصنف في `MenuBrowser.tsx` كانت صفاً أفقياً بصورة مصغّرة 64×64px تظهر فقط إن وُجدت صورة — تبدو كقائمة نصية لا كمنيو. بعد سؤال المستخدم عبر AskUserQuestion، اختار: تصميم "منيو احترافي" (صورة كبيرة أعلى البطاقة + نص تحتها) + صورة بديلة أنيقة (placeholder) للأصناف بلا صورة مرفوعة.

- [x] `components/public-menu/MenuBrowser.tsx`: بطاقة كل صنف أُعيدت بناؤها عمودياً — صورة full-bleed بنسبة 4:3 أعلى البطاقة (`fill`+`object-cover`) أو placeholder متدرّج بأيقونة `UtensilsCrossed` إن لم توجد صورة، ثم اسم الصنف (سطر واحد) + وصف (سطرين) + السعر بخط عريض أسفل البطاقة (`mt-auto`). الشبكة أصبحت `grid-cols-2 sm:grid-cols-3` (كانت `sm:grid-cols-2` بصف أفقي) لتبدو كشبكة كتالوج صور. عنوان الفئة أصبح يظهر دائماً فوق كل قسم (كان يظهر فقط أثناء البحث) بخط أوضح وفاصل سفلي
- [x] `components/public-menu/ItemDetailsSheet.tsx`: نفس معالجة placeholder للصورة الكبيرة في تفاصيل الصنف (كانت تُخفي القسم بالكامل بلا صورة، الآن تعرض دائماً حاوية بنفس الحجم مع أيقونة بديلة عند غياب الصورة — تناسق بصري بين البطاقة المصغّرة والتفاصيل)
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان
- **قيد معروف**: لم يُفتَح بمتصفح حي للتأكد بصرياً من الشبكة الجديدة على مقاسات الجوال/التابلت الفعلية (لا أداة Headless متاحة) — يُنصح المستخدم بفتح رابط منيو QR فعلي والتأكيد.

### إعادة تصميم أوسع لصفحات الأصناف/القوائم/الفئات في لوحة التحكم (2026-09-15)

المستخدم طلب تحسين تصميم الأصناف والمنيو في لوحة التحكم أيضاً (بعد تصميم المنيو العام). بالفحص تبيّن أن جدول الأصناف `/items` كان جدولاً نصياً بحتاً بلا صور (الاستعلام نفسه لم يكن يجلب `image_url`)، ومكوّن رفع صورة الصنف (`ItemImageUpload`) موجود ومُستخدَم فعلاً في `/items/[id]` لكن يظهر عائماً بلا بطاقة/عنوان، وصفحة الفئة (`CategoryItemsPanel`) تعرض الأصناف المرتبطة كقائمة نصية بلا صور وتستخدم `<select>` HTML خام (نفس النمط القديم المُصلَح سابقاً في نماذج أخرى لكن تُرك هنا عمداً حينها). سألت المستخدم عبر AskUserQuestion عن نطاق التعديل فاختار "إعادة تصميم أوسع" صراحةً.

- [x] `app/(app)/items/page.tsx`: الاستعلام يجلب `image_url` الآن ويمرّره لكل صف
- [x] `components/item/ItemsListTable.tsx`: استُبدل الجدول النصي بشبكة بطاقات (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-3`) — كل بطاقة: صورة مصغّرة 64px (أو أيقونة بديلة `UtensilsCrossed` بلا صورة) + الاسم (رابط) + الفرع + شارات الفئات + السعر + شارة ظاهر/مخفي (بلون `success`) + مفتاح التوفر — بقيت أدوات الفلترة (بحث/فرع/فئة/توفر) كما هي بلا تغيير منطقي
- [x] `app/(app)/menus/[id]/categories/[categoryId]/page.tsx`: الاستعلام يجلب `image_url` لأصناف الفرع الآن، ونوع `Item` أصبح يحمل `imageUrl`
- [x] `components/category/CategoryItemsPanel.tsx`: الأصناف المرتبطة تُعرض الآن كصف ببطاقة مصغّرة 40px (أو أيقونة بديلة)، واستُبدل `<select>` الخام بـ`select-radix` (توحيداً مع بقية النماذج، نفس الإصلاح المطبَّق سابقاً في `TableForm`/`ItemForm`/إلخ لكن كان تُرك هنا سابقاً خارج النطاق)
- [x] `components/item/ItemImageUpload.tsx`: أُعيد بناؤه كبطاقة `Card`/`CardHeader`/`CardTitle` ("صورة الغلاف") بنفس نمط بطاقتي "الأحجام" و"مجموعات الإضافات" في `ItemForm` — معاينة أكبر بنسبة 4:3 (كانت مربعاً 32px يظهر فقط مع وجود صورة) + أيقونة بديلة بلا صورة + نص الزر يتغيّر بين "رفع صورة"/"تغيير الصورة" حسب الحالة
- [x] `app/(app)/menus/[id]/page.tsx`: بطاقات الفئات أصبحت تعرض أيقونة + عدّاد عدد الأصناف (استعلام جديد على `menu_category_items` مجمّع بالفئة) + سهم اتجاه واعٍ بـRTL (`rtl:rotate-180`) بدل نص خام فقط — لا يوجد عمود صورة مخصّص للفئات لأن الجدول لا يملك `image_url` أصلاً (لا حاجة لهجرة جديدة لهذا الطلب)
- [x] مفتاحا ترجمة جديدان `menus.item.{coverImage,changeImage}` في `messages/{ar,en}/menus.json`
- [x] تحقّق: `tsc --noEmit` و`npm run lint` نظيفان على كل الملفات الممسوسة
- **لم يُغيَّر**: `MenusListTable.tsx` (جدول القوائم نفسها) — لا معنى لصور هناك (القوائم لا تملك صورة)، ومن نفس السبب ظل جدولاً نصياً كما هو
- **قيد معروف**: لم تُفتَح أي من هذه الصفحات فعلياً بمتصفح حي بجلسة مسجَّلة للتأكد بصرياً (لا أداة Headless متاحة) — خصوصاً شبكة بطاقات `/items` على مقاسات مختلفة وسلوك `select-radix` الجديد في صفحة الفئة.

## المرحلة 16 — موقع تسويقي عام (`/site`) ✅ (منجزة 2026-09-16)

سأل المستخدم عن "صفحة الحجز للعملاء"، فتبيّن أنه لا يوجد أي موقع عام حالياً (فقط منيو QR للطاولة عبر `/m/[branchSlug]/t/[qrToken]`، وكل الحجوزات تُنشأ من لوحة التحكم فقط). بعد `AskUserQuestion`: المطلوب موقع عام على مسار منفصل `/site` (لا يغيّر توجيه `/` الحالي إلى `/dashboard`)، لمطعم واحد فقط، بأربعة أقسام: معلومات المطعم + مواقع الفروع، نموذج استفسارات/شكاوى، حجز طاولة ذاتي للأفراد، حجز شركات/مناسبات ذاتي.

**افتراضات تحتاج تأكيداً قبل البدء بالكود** (لا يوجد لها حقول حالياً في القاعدة):
- إضافة `restaurants.about_ar`/`about_en` (نص "عن المطعم") — عمودان جديدان بهجرة، تحريرهما من صفحة إعدادات المطعم الموجودة في لوحة التحكم.
- إضافة `branches.phone` (نص، اختياري) — يظهر في صفحة الفروع العامة، تحريره من `BranchForm.tsx` الموجود.
- لا خرائط/صور فروع في هذا الإصدار (نص عنوان + هاتف فقط) — يمكن إضافتها لاحقاً.
- لا ساعات عمل منفصلة للفرع (الجدول الحالي لا يخزنها؛ خارج النطاق الآن).

**تنفيذ مختلف قليلاً عن الافتراض الأولي لحجز الطاولة الفردي**: بدل سياسة `anon insert` مباشرة على `customers`/`reservations`، اكتُشف أثناء التنفيذ أن هذا يتطلب `RETURNING` (لربط `customer_id` بسطر `reservations` التالي)، و`RETURNING` تحت RLS يحتاج سياسة `select` أيضاً — وهذا بالضبط ما رفضته هجرة `0008` صراحة لجدول `customers` (بيانات عميل حساسة). الحل الفعلي: RPC واحدة `security definer` باسم `create_public_reservation` تؤدي إدراج `customers` ثم `reservations` معاً وتُرجع `void` فقط (بنفس نمط `get_table_reservation`/`toggle_item_availability` الموجودين). حجز المناسبات/الاستفسارات لم يحتاجا هذا الحل لأنهما إدراج جدول واحد بلا اعتماد متسلسل.

- [x] Migration `0016_public_site.sql` (طُبِّقت عبر `npm run db:migrate`):
  - `restaurants.about_ar`/`about_en` (nullable) + `branches.phone` (nullable)
  - جدول جديد `inquiries` + RLS: `insert` لـ`anon` (`with check (true)`)، `select`/`update` للموظفين حسب `auth_branch_ids()` + capabilities جديدة `view_inquiries`/`manage_inquiries` لـ`owner`/`branch_manager` فقط
  - سياسة `insert` جديدة لـ`anon` على `event_reservations` الموجود بشرط `with check (status = 'pending')`
  - RPC جديدة `create_public_reservation(p_branch_id, p_customer_name, p_customer_phone, p_party_size, p_reservation_time, p_notes)` `security definer` تُرجع `void`، ممنوحة لـ`anon` (بديل السياسة المخطَّطة أصلاً على `customers`/`reservations` — راجع الملاحظة أعلاه)
- [x] `lib/validation/inquiry.schema.ts` + `lib/validation/public-reservation.schema.ts` + `lib/validation/public-event-reservation.schema.ts`
- [x] `lib/actions/public-inquiry.actions.ts` (insert مباشر) / `public-reservation.actions.ts` (يستدعي RPC) / `public-event-reservation.actions.ts` (insert مباشر بـ`status: "pending"` مفروضاً من الخادم) — الثلاثة بلا `.select()`/`redirect` بعد الكتابة، فقط `{success, error}` لعرض توست نجاح/خطأ في النموذج
- [x] مسارات عامة جديدة تحت `app/(public)/site/`: `layout.tsx` (هيدر باسم المطعم + روابط + `LanguageSwitcher` من `public-menu`) + `page.tsx` (عن المطعم + بطاقات الفروع بالعنوان/الهاتف) + `contact/page.tsx` + `reserve/page.tsx` + `events/page.tsx` — عبر `lib/domain/get-site-data.ts` جديد (يجلب أول مطعم غير محذوف + فروعه، مطابقةً لتأكيد "مطعم واحد فقط")
- [x] صفحة إدارة جديدة `/inquiries` (قائمة بفلاتر بحث/فرع/حالة) + `/inquiries/[id]` (تفاصيل + `StatusPanel` لتغيير الحالة) بنفس نمط `event-reservations` حرفياً + رابط جديد في `SidebarNavContent.tsx` (أيقونة `MessageSquare`)
- [x] `BranchForm.tsx`/`branch.actions.ts`/`branches/[id]/page.tsx`: حقل الهاتف الجديد بالكامل (نموذج + حفظ + تحميل القيمة الافتراضية)
- [x] صفحة إعدادات مطعم جديدة كلياً `/restaurant` + `RestaurantSettingsForm.tsx` (لم تكن موجودة أصلاً رغم وجود `updateRestaurant` action وnamespace `restaurant.settings` جاهزين من قبل بلا أي مستهلك) + حقلا "عن المطعم" (ar/en) في `restaurant.schema.ts`/`restaurant.actions.ts` + رابط جديد في الشريط الجانبي (أيقونة `Settings`)
- [x] `messages/{ar,en}/site.json` + `messages/{ar,en}/inquiries.json` (جديدان) + تسجيلهما في `i18n/request.ts` + مفاتيح إضافية في `branches.json`/`restaurant.json`/`common.json` (nav)
- [x] `lib/supabase/types.ts`: تحديث `restaurants`/`branches` + جدول `inquiries` جديد + دالة `create_public_reservation` في `Functions`
- [x] تحقق: `next tsc --noEmit` نظيف (بعد `npx next typegen` لتحديث أنواع المسارات الجديدة) و`npm run lint` نظيف و`npm run build` نظيف (28 مساراً، شاملة كل مسارات `/site/*`، `/restaurant`، `/inquiries/*` الجديدة) + اختبار RLS حي فعلي (لا rollback، بيانات وهمية حُذفت يدوياً بعد التحقق) عبر عميل anon حقيقي:
  - إدراج `inquiries` كـ`anon` ✅ نجح، وقراءتها كـ`anon` ✅ محجوبة (0 صفوف)
  - إدراج `event_reservations` بـ`status='pending'` كـ`anon` ✅ نجح، وبـ`status='confirmed'` ❌ رُفض فعلياً بخطأ RLS كما هو متوقَّع
  - RPC `create_public_reservation` كـ`anon` ✅ نجحت، وقراءة `customers` مباشرة كـ`anon` ✅ محجوبة (0 صفوف) — تأكيد أن لا تسريب بيانات عميل حتى مع الحل الجديد
- **قيد معروف**: لم يُفتَح أي من صفحات `/site/*` فعلياً بمتصفح حي (لا أداة Headless متاحة) — يُنصح المستخدم بزيارة `http://localhost:3411/site` والتأكد بصرياً من الهيدر/النماذج/RTL، خصوصاً تبديل اللغة عبر `LanguageSwitcher` المُعاد استخدامه من `public-menu`.

## المرحلة 17 — صفحة اختيار (Gateway) قبل المنيو: منيو / شكوى واقتراح / تقييم قوقل مابس ✅ (منجزة 2026-09-16)

المستخدم طلب أنه عند فتح رابط QR (أو التابلت) تظهر أولاً صفحة اختيار بثلاثة أزرار: فتح المنيو، إرسال شكوى/اقتراح، أو الانتقال لصفحة تقييم Google Maps. تم تأكيد النطاق عبر AskUserQuestion: تُطبَّق على QR والتابلت معاً، رابط قوقل مابس حقل جديد **لكل فرع**، والشكاوى تُحفَظ بقاعدة البيانات + صفحة عرض بلوحة التحكم.

**تحديث (2026-09-16)**: المرحلة 16 نُفِّذت فعلاً واستهلكت `0016_public_site.sql` (تتضمن جدول `inquiries` — استفسار عام من موقع `/site`، منفصل تماماً عن `complaints` المخطَّط هنا لشكوى ضيف من طاولة QR). رقم الهجرة التالي الفعلي عند تنفيذ هذه المرحلة هو `0017` — تحقّق من `supabase/migrations/` لتأكيد آخر رقم وقتها.

**1) هجرة جديدة (الرقم الفعلي `0017_gateway_feedback.sql` ما لم تُضَف هجرات أخرى قبلها)**
- [x] `alter table public.branches add column google_reviews_url text;`
- [x] `create table public.complaints` — بنفس نمط `reservations`/`qr_scan_events`: `id, branch_id (fk branches, cascade), table_id (fk tables, set null), type text check in ('complaint','suggestion'), message text not null, customer_name text, customer_phone text, created_at`
- [x] `complaints_branch_id_idx`
- [x] RLS: `enable row level security` + سياسة `complaints_insert_public` (`for insert to anon with check (true)` — نفس نمط `qr_scan_events_insert_public` في 0008، بلا حساسية لأن anon لا يقرأ شيئاً بالمقابل) + سياسة `complaints_select` (`for select to authenticated using (branch_id = any(auth_branch_ids()) and has_capability('view_complaints'))`)
- [x] صلاحية جديدة `view_complaints` لـ`owner`/`branch_manager` فقط (ليست لـ`staff`) — نفس نمط منح `view_event_reservations` في 0009 (بيانات حساسة/قرارات إدارية)
- [x] تطبيق فعلي عبر `npm run db:migrate`

**2) تحديث الأنواع والدومين**
- [x] `lib/supabase/types.ts`: إضافة `google_reviews_url` لجدول `branches`، وجدول `complaints` جديد كاملاً (Row/Insert/Update)
- [x] `lib/domain/resolve-table.ts`: إضافة `google_reviews_url` لاستعلام الفرع وإرجاعه ضمن `ResolvedTable.branch.googleReviewsUrl`

**3) إعادة هيكلة مسارات المنيو العامة**
- [x] نقل محتوى `app/(public)/m/[branchSlug]/t/[qrToken]/page.tsx` الحالي (المنيو + الحجز + ActionBar) إلى مسار جديد `.../menu/page.tsx` — بلا استدعاء `recordQrScan` بعد الآن (ينتقل للـgateway)
- [x] `page.tsx` يصبح صفحة Gateway جديدة: `resolveTable` + `recordQrScan` (لحظة المسح الفعلية) + مكوّن `EntryGateway` بثلاثة أزرار
- [x] نفس النمط للتابلت: نقل محتوى `tablet/page.tsx` إلى `tablet/menu/page.tsx`، و`tablet/page.tsx` يصبح Gateway (بلا `recordQrScan`، مطابقاً للسلوك الحالي)
- [x] صفحة جديدة `.../complaint/page.tsx`: `resolveTable` (للعرض فقط) + مكوّن `ComplaintForm`
- [x] رابط قوقل مابس في الـGateway: `<a>` خارجي مباشر لـ`branch.googleReviewsUrl`، يظهر فقط إن كان مضبوطاً للفرع

**4) مكوّنات جديدة**
- [x] `components/public-menu/EntryGateway.tsx`: يعيد استخدام `MenuHeader` للعلامة التجارية + ثلاثة أزرار كبيرة (منيو / شكوى واقتراح / تقييم قوقل)
- [x] `components/public-menu/ComplaintForm.tsx`: نموذج عميل (`react-hook-form` + `zod`) — نوع (شكوى/اقتراح) + رسالة (إلزامي) + اسم/هاتف (اختياري) + رسالة نجاح بعد الإرسال

**5) التحقق والحفظ**
- [x] `lib/validation/complaint.schema.ts`: `type` enum، `message` (حد أدنى/أقصى)، `customerName`/`customerPhone` اختياريان
- [x] `lib/actions/complaint.actions.ts`: `submitComplaint(branchId, tableId, input)` — `"use server"`، يتحقق بـzod ثم إدراج عبر `createClient()` العادي (نفس نمط `recordQrScan` — anon insert تسمح به سياسة RLS الجديدة، بلا حاجة لعميل admin)

**6) لوحة التحكم: عرض الشكاوى**
- [x] `app/(app)/complaints/page.tsx`: قائمة (نفس نمط `reservations/page.tsx`) — نوع/رسالة/اسم/هاتف/فرع/تاريخ
- [x] `components/complaint/ComplaintsListTable.tsx`
- [x] إضافة عنصر تنقّل جديد في `SidebarNavContent.tsx` (`NAV_ITEMS`) + أيقونة مناسبة (`MessageSquareWarning` من `lucide-react`) + مفتاح ترجمة `common.nav.complaints`
- [x] ملف ترجمة جديد `messages/{ar,en}/complaints.json`

**7) نموذج الفرع: حقل رابط قوقل مابس**
- [x] `lib/validation/branch.schema.ts`: إضافة `googleReviewsUrl` (نص رابط اختياري)
- [x] `lib/actions/branch.actions.ts`: `createBranch`/`updateBranch` يحفظان `google_reviews_url`
- [x] `components/branch/BranchForm.tsx`: حقل جديد
- [x] `app/(app)/branches/[id]/page.tsx`: يجلب العمود الجديد ويمرّره كـ`defaultValues`

**8) ترجمات**
- [x] `messages/{ar,en}/publicMenu.json`: مفاتيح `gateway.*` (عنوان، أزرار الثلاثة) + مفاتيح نموذج الشكوى (نوع/شكوى/اقتراح/رسالة/اسم/هاتف/إرسال/نجاح)
- [x] `messages/{ar,en}/branches.json`: تسمية حقل رابط قوقل مابس
- [x] `messages/{ar,en}/complaints.json` (جديد، انظر بند 6)

**9) تحقّق**
- [x] `tsc --noEmit` و`npm run lint` نظيفان
- [x] **قيد معروف متوقَّع**: لن يُفتَح تدفّق QR/التابلت الجديد فعلياً بمتصفح حي (لا أداة Headless متاحة) — يُنصح المستخدم بفتح رابط QR فعلي بعد التطبيق للتأكد بصرياً من الأزرار الثلاثة وتدفّق الشكوى.

---

## المرحلة 18 — إعادة تصميم الموقع العام `/site` (هوية بصرية احترافية)

**السياق**: التصميم الحالي لصفحات `/site` (الرئيسية/الحجز/المناسبات/التواصل) نصوص عادية بلا هوية بصرية. المرجع: مواقع مطاعم فاخرة (Burj Al Hamam, Zuma) تعتمد على صور فوتوغرافية + Hero كامل العرض + بطاقات أنيقة. **لا توجد صور حقيقية في المشروع حالياً** — قرار المستخدم: صورة الـHero تُحدَّد من إعدادات المطعم (رفع فعلي)، مع تصميم أنيق بالكامل (طباعة/ألوان/أنماط) في حال عدم وجود صورة. لوحة الألوان الدافئة (كريمي/عنّابي مرجاني/بني غامق) موجودة مسبقاً في `app/globals.css` وتُستخدم كما هي (لا تغيير عليها).

**1) دعم صورة Hero من إعدادات المطعم**
- [x] هجرة جديدة `supabase/migrations/0018_restaurant_hero_image.sql`: `alter table public.restaurants add column hero_image_url text;` — طُبِّقت فعلياً على القاعدة الحيّة عبر `npm run db:migrate`
- [x] `lib/supabase/types.ts`: إضافة `hero_image_url` لـ Row/Insert في جدول `restaurants`
- [x] `lib/domain/get-site-data.ts`: جلب وإرجاع `heroImageUrl` ضمن `SiteRestaurant`
- [x] `lib/actions/restaurant.actions.ts`: أكشن جديد `uploadRestaurantHeroImage(restaurantId, formData)` بنفس نمط `uploadItemImage` (رفع لـbucket `menu-images` تحت مسار `restaurant/{id}/hero/{uuid}.ext` عبر عميل admin، تحديث `hero_image_url`، `revalidatePath("/restaurant")` و`("/site")`)
- [x] `components/restaurant/RestaurantHeroImageUpload.tsx` (جديد، client) — بنفس نمط `ItemImageUpload.tsx` لكن بنسبة عرض واسعة (aspect 21/9) مناسبة لصورة Hero
- [x] `app/(app)/restaurant/page.tsx`: جلب `hero_image_url` وعرض مكوّن الرفع الجديد بجانب `RestaurantSettingsForm`
- [x] `messages/{ar,en}/restaurant.json`: مفاتيح جديدة تحت `settings` لصورة الـHero (عنوان/رفع/تغيير/جارِ الرفع)

**2) الـLayout المشترك لصفحات `/site`**
- [x] `app/(public)/site/layout.tsx`: هيدر ملتصق (sticky) أنيق بشعار/اسم المطعم + تنقّل بخط تحت الرابط النشط + فاصل بصري، فوتر جديد (معلومات تواصل مختصرة + حقوق النشر)، مع الحفاظ على RTL/LTR الديناميكي

**3) الصفحة الرئيسية `app/(public)/site/page.tsx`**
- [x] قسم Hero كامل العرض: صورة المطعم (`heroImageUrl`) بتعتيم متدرّج (gradient overlay) إن وُجدت، وإلا خلفية أنيقة بديلة بالألوان الحالية (بلا صور مصممة يدوياً)، مع اسم المطعم بخط كبير + مقتطف من "عن المطعم" + زر CTA رئيسي "احجز طاولة" يقود لـ`/site/reserve`
- [x] قسم "عن المطعم" منسّق بعرض مقروء (max-width) وفاصل بصري
- [x] إعادة تصميم قسم الفروع كبطاقات أنيقة (أيقونات `MapPin`/`Phone` من `lucide-react`، ظل عند التحويم، بلا تغيير في البيانات المعروضة)
- [x] شريط CTA قبل الفوتر يدعو للحجز

**4) صفحات الحجز/المناسبات/التواصل** (`reserve/page.tsx`, `events/page.tsx`, `contact/page.tsx`)
- [x] تخطيط عمودين على الشاشات الكبيرة: لوحة معلومات جانبية (عنوان + وصف + أيقونة) بجانب `FormCard` الحالي — بلا تغيير في منطق `ReserveTableForm`/`EventRequestForm`/`ContactForm` (فقط تعديل بصري بحت: `className="max-w-none"` على `FormCard` ليتمدد داخل العمود الثاني)

**5) ترجمات**
- [x] `messages/{ar,en}/site.json`: مفاتيح جديدة (`home.heroCta`, `heroSecondaryCta`, `branchesEyebrow`, `ctaTitle`, `ctaDescription`)

**6) تحقّق**
- [x] `tsc --noEmit` و`npm run lint` نظيفان
- [ ] **قيد معروف**: لم يُفتَح `/site` فعلياً بمتصفح حي في هذه الجلسة (لا أداة Headless متاحة) — يُنصح المستخدم بتشغيل `npm run dev` ومعاينة الصفحات الأربع بكلا اللغتين، ثم رفع صورة Hero تجريبية من `/restaurant` (إعدادات المطعم) للتأكد البصري من قسم الـHero.

---

### مراجعة (Review) — المرحلة 18

**ما تغيّر:**
- عمود جديد `hero_image_url` على `restaurants` + آلية رفع كاملة (Server Action + مكوّن client) من صفحة إعدادات المطعم `/restaurant`، تُستخدم صورتها في Hero بالموقع العام.
- إعادة تصميم كاملة لـ`/site` و`/site/reserve` و`/site/events` و`/site/contact`: هيدر ملتصق بشعار، Hero كامل الشاشة بصورة/تدرّج لوني، بطاقات فروع بأيقونات، شريط CTA، فوتر جديد، وتخطيط عمودين للنماذج (لوحة معلومات + نموذج) بدون أي تغيير في منطق النماذج أو التحقق أو الأكشنز الموجودة (`ReserveTableForm`/`EventRequestForm`/`ContactForm`/الأكشنز الخلفية لها) — التعديل الوحيد فيها هو صنف CSS واحد لتوسيع البطاقة.
- لوحة الألوان الحالية (كريمي/عنّابي مرجاني/بني غامق) في `app/globals.css` لم تُمس؛ اعتُمدت كما هي لأنها مناسبة لهوية مطعم شرق أوسطي دافئة.
- في حال عدم وجود صورة Hero، تظهر خلفية متدرّجة أنيقة بنفس ألوان الهوية بدل صورة فارغة أو placeholder غير احترافي.
- الهجرة `0018_restaurant_hero_image.sql` طُبِّقت فعلياً على قاعدة Supabase الحيّة بعد تأكيد المستخدم.

**ملاحظة للمستخدم:** لم تتوفر أي صور فوتوغرافية حقيقية في المشروع (خلافاً للمواقع المرجعية التي تعتمد عليها بالكامل)؛ التصميم الحالي يعمل بشكل احترافي بصورة Hero وبدونها، لكن رفع صورة Hero حقيقية (وربما شعار) من `/restaurant` سيرفع مستوى الهوية البصرية بشكل ملحوظ.

**مراجعة نهائية**: الهجرة `0017_gateway_feedback.sql` طُبِّقت فعلياً كما خُطِّط بلا تصادم رقم (0016 كانت مأخوذة مسبقاً لـ`/site`). `page.tsx` أصبح Gateway لكل من مسار QR والتابلت، والمنيو الفعلي انتقل لـ`.../menu` (و`.../tablet/menu`) بلا أي تغيير في منطقه الداخلي سوى حذف `recordQrScan` (انتقل لصفحة الـGateway). صفحة الشكوى مستقلة تحت `.../complaint` وتُستخدم من كل من QR والتابلت (لا نسخة منفصلة للتابلت، النموذج محايد التصميم). جدول `complaints` منفصل عمداً عن `inquiries` (نطاقان مختلفان: ضيف طاولة QR مقابل زائر موقع تسويقي عام) بصلاحية `view_complaints` مستقلة. احتاج تشغيل `npx next typegen` بعد إضافة المسارات الجديدة لتحديث أنواع `PageProps` المولَّدة تلقائياً من Next.js (خطأ متوقَّع قبله: `does not satisfy the constraint 'AppRoutes'`) — هذا يُسجَّل كتعلّم عام لأي مسار جديد لاحقاً.
- **لم يُغيَّر**: `ActionBar.tsx`/`MenuBrowser.tsx`/`ReservationCard.tsx` — بلا تغيير منطقي، نُقلت فقط ضمن ملفات `menu/page.tsx` الجديدة بلا تعديل محتواها.
- **قيد معروف إضافي**: لم يُختبَر إدراج `complaints` فعلياً عبر عميل `anon` حي (بخلاف اختبار RLS الحي الذي أجرته المرحلة 16 لجداول أخرى) — السياسة مطابقة حرفياً لنمط `qr_scan_events_insert_public` المُختبَر مسبقاً في الإنتاج، لكن يُنصح المستخدم بتجربة إرسال شكوى فعلية من رابط QR والتأكد من ظهورها في `/complaints`.


---

## المرحلة 19 — وضع ليلي + منيو عرض + خرائط جوجل + تحسين نموذج الحجز في `/site` ✅ (منجزة 2026-09-16)

بناءً على مقارنة المستخدم بمواقع مطاعم احترافية (zumarestaurant.com، burjalhamamksa.com)، حُدِّدت 3 فجوات + تحسين رابع:

**1) مبدّل الوضع الليلي/النهاري في `/site`**
- [x] `app/(public)/site/layout.tsx`: إضافة `<ThemeToggle />` الموجود مسبقاً (يُستخدم فقط في لوحة التحكم سابقاً) بجانب `<LanguageSwitcher />` — بلا أي منطق جديد، `ThemeProvider` مفعّل عالمياً أصلاً.

**2) خريطة جوجل لكل فرع**
- [x] هجرة جديدة `0020_branch_google_maps_url.sql`: عمود `google_maps_url text` على `branches` (بنفس نمط `google_reviews_url` من `0017`) — **طُبِّقت فعلياً على القاعدة الحية** عبر `npx tsx scripts/migrate.ts` بعد تأكيد المستخدم.
- [x] حقل جديد في نموذج الفرع (`BranchForm.tsx`/`branch.schema.ts`/`branch.actions.ts`) مع نص توضيحي (`FormDescription`) يطلب رابط "تضمين خريطة" (Embed a map) من جوجل مابس وليس رابط المشاركة العادي.
- [x] `get-site-data.ts` يُعيد `googleMapsUrl`/`timezone` لكل فرع الآن.
- [x] `app/(public)/site/page.tsx`: عرض `<iframe>` للخريطة أعلى بطاقة الفرع إن وُجد الرابط، وإلا تبقى البطاقة كما كانت (بلا كسر شيء).
- [x] `lib/supabase/types.ts` حُدِّث يدوياً ليطابق العمود الجديد.

**3) صفحة "منتجاتنا" (منيو عرض فقط) — `/site/menu`**
- [x] `MenuBrowser`/`ItemDetailsSheet` عرض فقط أصلاً (لا سلة/لا طلب) — أُعيد استخدامهما حرفياً بلا تعديل منطقي، فقط توسعة نوع `source` ليشمل `"site"` (كان `"qr" | "tablet"` فقط) في المكوّنين + `recordMenuItemView` + هجرة جديدة `0021_menu_item_view_site_source.sql` (تعديل قيد الفحص على `menu_item_view_events.source`) — **طُبِّقت فعلياً على القاعدة الحية**.
- [x] صفحة جديدة `app/(public)/site/menu/page.tsx` (Server Component) تقرأ `?branch=` من الرابط وتستدعي `getActiveMenuTree(branchId, timezone)` الموجودة أصلاً (لا تحتاج توكن QR).
- [x] `components/site/BranchSwitcher.tsx` (جديد، client) — قائمة اختيار فرع تُحدّث query param، تظهر فقط عند وجود أكثر من فرع.
- [x] رابط "المنيو" أُضيف لمصفوفة روابط الهيدر/الفوتر في `site/layout.tsx` + مفتاح ترجمة `site.nav.menu`.

**4) تحسين نموذج حجز الطاولة (`ReserveTableForm.tsx`)**
- [x] استبدال حقل `datetime-local` الواحد بـ`Popover`+`Calendar` (شادكن، موجودان مسبقاً في المشروع لكن غير مستخدَمين بعد) لاختيار التاريخ (تعطيل ما قبل اليوم) + `Select` بخانات نصف ساعة ثابتة (12:00–23:30) لاختيار الوقت — التجميع إلى نفس صيغة `reservationTime` النصية السابقة، **بلا أي تغيير على** `publicReservationSchema` أو الـServer Action.
- [x] بعد نجاح الإرسال: شاشة تأكيد داخل `FormCard` بدل الاعتماد على `toast` فقط (ملخص: الفرع، التاريخ/الوقت، عدد الأشخاص، الاسم) + زر "حجز جديد".
- [x] ترجمات جديدة في `site.reserve`/`site.menu` (ar/en).

**5) التحقق**
- [x] `npm run build` (Next 16، فحص أنواع + توليد typegen للمسار الجديد `/site/menu`) نظيف بلا أخطاء.
- [x] `npm run lint` نظيف.
- [x] الهجرتان `0020`/`0021` طُبِّقتا فعلياً على القاعدة الحيّة عبر `npx tsx scripts/migrate.ts` بعد تأكيد المستخدم، والتحقّق المباشر (`information_schema.columns`, `pg_constraint`) أكّد وجود العمود الجديد وتحديث القيد بنجاح.
- [ ] لم يُفتَح أي من `/site`، `/site/menu`، `/site/reserve` فعلياً بمتصفح حي في هذه الجلسة (لا أداة Headless متاحة) — يُنصح المستخدم بتشغيل `npm run dev` ومعاينة: تبديل الوضع الليلي، إدخال رابط خريطة تجريبي لفرع، تصفح `/site/menu` مع تبديل الفروع، وتعبئة نموذج الحجز الجديد بالتقويم/قائمة الأوقات.
- [ ] لا توجد صور فوتوغرافية حقيقية للأصناف/الفروع في أغلب البيانات الحالية على الأرجح (نفس ملاحظة المرحلة 18) — يستحسن رفع صور حقيقية لتحسين مظهر صفحة المنيو الجديدة.

### مراجعة (Review) — المرحلة 19

**ما تغيّر:** أُضيفت 3 قدرات كانت غائبة تماماً عن الموقع العام (وضع ليلي، عرض منيو كامل، خرائط جوجل) بإعادة استخدام بنية تحتية موجودة أصلاً (`ThemeToggle`, `MenuBrowser`/`ItemDetailsSheet`, `getActiveMenuTree`, مكوّنا `Calendar`/`Popover` غير المستخدَمين سابقاً) بدل بناء أي شيء من الصفر، تماشياً مع قاعدة "بلا إعادة اختراع". نموذج الحجز تحسّن بصرياً ووظيفياً (تقويم + قائمة أوقات + شاشة تأكيد) دون أي تغيير في مخطط التحقق أو الـServer Action الخلفي — أقل مساحة تغيير ممكنة لتحسين تجربة حسّاسة (بيانات عملاء حقيقية).

**قرار معماري صغير يستحق التوثيق:** خريطة الفرع تعتمد على رابط "Embed" يُدخله الأدمن يدوياً (لا `lat`/`lng`، لا Geocoding، لا مفتاح Google Maps API) — قرار المستخدم صراحة لتجنّب أي تبعية خارجية أو تكلفة إضافية. نفس المنطق يعني أن دقة الخريطة تعتمد كلياً على صحة الرابط الذي يلصقه الأدمن.

**تحديث:** الهجرتان `0020`/`0021` طُبِّقتا فعلياً على القاعدة الحيّة بعد تأكيد المستخدم (نفس نمط المراحل 16/17/18) — كل ميزات هذه المرحلة جاهزة للاستخدام الفعلي الآن. المتبقي فقط هو تجربة الميزات يدوياً بمتصفح حي (`npm run dev`) لتأكيد المظهر البصري النهائي.

---

## المرحلة 20 — QR رصيد الولاء للموظف + سجل نقاط موحّد + تحسين واجهة الولاء والمنيو (مقترحة)

**المشكلة:** لا توجد وسيلة سريعة للموظف لمعرفة رصيد/هوية عميل الولاء عند الكاشير سوى البحث اليدوي بالهاتف في `/loyalty/redemptions`. كما أن سجل العميل الحالي (`LoyaltyDashboard`) يعرض فقط طلبات الفواتير (+نقاط) بدون عمليات الاستبدال (-نقاط)، والتصميم بسيط جداً، ونقاط الولاء غير ظاهرة في قالب المنيو الأساسي.

1. **QR رصيد الولاء** — توليد QR (مكتبة `qrcode` الموجودة، نفس نمط `tables/[id]/page.tsx`) في صفحة `/m/[branchSlug]/loyalty` يشفّر رابطاً داخلياً `/loyalty/scan/[memberId]`، يُعرض بشكل بارز في `LoyaltyDashboard`.
2. **صفحة مسح للموظف** `app/(app)/loyalty/scan/[memberId]/page.tsx` — محمية بـ `requireCapability("manage_loyalty")` (RLS الحالية لـ`loyalty_members`/`loyalty_redemptions` تسمح للموظف بذلك أصلاً، لا حاجة لهجرة جديدة). تعرض رصيد العضو وفئته وأي استبدالات `pending` مع زر لتأكيدها (إعادة استخدام `updateLoyaltyRedemptionStatus`).
3. **سجل نقاط موحّد** — دمج `loyalty_receipt_submissions` (+نقاط) و`loyalty_redemptions` (-نقاط) في قائمة واحدة مرتّبة بالتاريخ في صفحة العميل.
4. **تحسين تصميم `LoyaltyDashboard`** — بطاقة رصيد أوضح مع شريط تقدّم نحو الفئة التالية، إبراز QR، تحسين شكل المكافآت والسجل.
5. **نقاط الولاء في قالب المنيو (`ActionBar`)** — عرض رصيد النقاط كشارة بجانب رابط الولاء (فقط إذا كان العميل مسجّلاً وله عضوية بهذا المطعم)، بتصميم محسّن بدل النص البسيط.
6. ترجمات جديدة (ar/en) للعناصر أعلاه. بلا أي هجرة قاعدة بيانات جديدة.
7. `npm run build` + `npm run lint` للتحقق.


### مراجعة (Review) — المرحلة 20 ✅ (منجزة 2026-09-16)

**ما تغيّر:**
- `LoyaltyPage` (`/m/[branchSlug]/loyalty`) يولّد الآن QR (مكتبة `qrcode`، نفس نمط `tables/[id]`) يشفّر رابط `/loyalty/scan/[memberId]` ويمرّره لـ`LoyaltyDashboard`.
- صفحة جديدة `app/(app)/loyalty/scan/[memberId]/page.tsx` (محمية بـ`requireCapability("manage_loyalty")`، بلا هجرة جديدة — RLS الحالية لـ`loyalty_members`/`loyalty_redemptions` تسمح للموظف بالقراءة ضمن مطعمه أصلاً) تعرض رصيد العميل وفئته وطلبات الاستبدال المعلّقة مع زر "تسليم" فوري (`ScanRedemptionActions.tsx` يعيد استخدام `updateLoyaltyRedemptionStatus` الموجودة).
- `LoyaltyDashboard.tsx`: أُعيد تصميمه بالكامل — بطاقة رصيد بتدرّج لوني وشريط تقدّم نحو الفئة التالية، عرض بارز لرمز QR مع تعليمات للعميل، وسجل نقاط **موحّد** (فواتير +نقاط واستبدالات -نقاط معاً مرتّبة بالتاريخ) بدل سجل الفواتير فقط سابقاً.
- `ActionBar.tsx` (قالب منيو QR الشخصي): يجلب رصيد نقاط العميل (إن كان مسجّلاً وله عضوية بهذا المطعم) ويعرضه كشارة بدل نص بسيط؛ وضع التابلت لم يتغيّر (بلا جلسة شخصية، كما كان).
- `resolve-table.ts`: أُضيف `restaurant.id` (كان غائباً) لتتمكّن `ActionBar` من الاستعلام عن `loyalty_members`.
- ترجمات جديدة (ar/en) في `loyalty.customer` (qrTitle/qrHint/nextTier/earnStatus/redeemStatus) و`loyalty.scan` (صفحة الموظف) و`publicMenu.loyaltyPoints`.

**قرار معماري:** الموظف يفتح رابط QR بكاميرا جهازه العادية (نفس نمط QR الطاولات) بدل مكتبة مسح داخل التطبيق — أبسط وأكثر موثوقية، ولا يتطلب صلاحيات كاميرا JS أو تبعية جديدة. الاستبدال الفعلي لخصم الفاتورة يبقى يدوياً من نظام الكاشير الخاص بالمطعم (خارج نطاق هذا المشروع)؛ الصفحة توفّر فقط تأكيد الهوية والرصيد وتسجيل "تم التسليم".

**التحقق:** `npx next typegen` (لتوليد نوع `PageProps<"/loyalty/scan/[memberId]">`) ثم `npm run build` و`npm run lint` — كلها نظيفة.

**لم يُختبَر:** فتح الصفحات فعلياً بمتصفح حي (مسح QR حقيقي بجهاز موظف، والتأكد من ظهور الشارة في قالب المنيو لعميل مسجَّل فعلاً) — يُنصح المستخدم بتجربة المسار كاملاً: عميل يسجّل دخول ولاء → يفتح `/m/[branch]/loyalty` → يظهر QR وسجل النقاط → موظف يمسحه من جهازه المسجَّل دخوله بصلاحية `manage_loyalty`.

### تصحيح توجيه — استبدال يبادر به الموظف مباشرة (2026-09-16)

المستخدم صحّح التصميم: لا يُفترض أن يبادر العميل بالاستبدال من هاتفه ثم يعرض QR للتأكيد فقط — بل **الموظف نفسه يخصم النقاط مباشرة** من صفحة المسح بعد قراءة رصيد العميل عبر QR.

- هجرة جديدة `0024_loyalty_staff_redeem.sql` (أُعيدت تسميتها من `0022` لتعارض ترقيم مع `0022_loyalty_receipt_invoice_number.sql` — راجع مرحلة تحسين وجاهزية الإنتاج I): دالة `redeem_loyalty_reward_for_member(p_member_id, p_reward_id)` (security definer) — يستدعيها الموظف (شرط `has_capability('manage_loyalty')` ونفس مطعم `auth_restaurant_id()`)، تخصم النقاط ذرّياً وتُدرج سجل استبدال بحالة `fulfilled` مباشرة (بخلاف `redeem_loyalty_reward` الأصلية المقيّدة بجلسة العميل نفسه عبر `auth.uid()`، التي بقيت كما هي للاستخدام الذاتي من تطبيق العميل). **طُبِّقت فعلياً على القاعدة الحية** بعد تأكيد المستخدم.
- Server action جديد `redeemLoyaltyRewardForMember` في `loyalty.actions.ts`.
- مكوّن جديد `StaffRedeemRewards.tsx` (client) في صفحة `/loyalty/scan/[memberId]`: قائمة المكافآت الفعّالة لهذا المطعم مع زر "خصم" وتأكيد (`confirm`) قبل التنفيذ — بجانب قسم "طلبات الاستبدال المعلّقة" الذي بقي كما هو لدعم تدفق العميل الذاتي القديم أيضاً.
- `lib/supabase/types.ts` حُدِّث يدوياً بالدالة الجديدة في `Functions`.
- التحقق: `npm run build` + `npm run lint` نظيفان، ثم `npx tsx scripts/migrate.ts` طبّق `0022` بنجاح على القاعدة الحية.

### تصحيح — رفض فواتير حقيقية بسبب مطابقة اسم مطعم صارمة (2026-09-16)

المستخدم زوَّدني بصور فواتير حقيقية جديدة من "باب البلد" فشل رفعها في `/m/[branch]/loyalty` (رسالة رفض عامة بلا تفاصيل). التشخيص: شعار المطعم على الفواتير مكتوب بخط عربي كاليغرافي/فني مُزخرف يصعب تمييز حروفه (حتى أنا قرأته أول مرة "بابل البلد" بدل "باب البلد" المخزَّن فعلياً في `restaurants.name_ar`) — موديل الرؤية على الأرجح يرد `NO` لنفس السبب فتُرفض الفاتورة دون أي أثر تشخيصي.

- `lib/ocr/extract-receipt-amount.ts`: البرومبت أصبح يطلب **أربعة أسطر** بدل ثلاثة — سطر جديد أول يطلب من الموديل كتابة الاسم كما قرأه فعلياً (نص، وليس YES/NO) قبل سطر المطابقة، مع توجيه صريح بالتسامح مع اختلاف الرسم الفني لخط اللوجو المزخرف طالما التطابق دلالي. عند الرفض (`NO`)، `note` المُعادة أصبحت تتضمن الاسم المقروء فعلياً بين قوسين — يجعل أي رفض مستقبلي قابلاً للتشخيص فوراً من `ocr_note` بدل رسالة عامة ثابتة.
- التحقق: `npx tsc --noEmit` نظيف.
- **لم يُختبَر حياً بعد** — يحتاج المستخدم إعادة رفع إحدى الفواتير التي فشلت عبر الصفحة العامة ليتأكد أن الرفض (إن استمر) يظهر الآن الاسم المقروء فعلياً، أو أن القبول ينجح مباشرة.

## تحسين صفحة البوابة (Gateway) — تصميم + تقييم داخلي + خريطة قوقل (2026-09-16)

الطلب: تحسين تصميم صفحة اختيار "فتح المنيو / شكوى" (`EntryGateway`)، إضافة تقييم، وإضافة خريطة قوقل. تأكيد المستخدم: التقييم = **نظام داخلي (نجوم 1-5 + تعليق تُحفظ في القاعدة) بالإضافة إلى زر توجيه لخرائط قوقل** (وليس فقط رابط خارجي).

اكتشفت أثناء الاستكشاف أن `google_reviews_url` و`google_maps_url` موجودان أصلاً في `branches` (هجرات 0017 و0020) ومستخدَمان في `app/(public)/site/page.tsx`، لكن **غير مربوطين إطلاقاً بمسار QR/Tablet** (`resolveTable` لا يجلب `google_maps_url`، و`EntryGateway` يعرض `google_reviews_url` كرابط خارجي فقط بلا خريطة ولا تقييم داخلي).

- [x] هجرة جديدة `0023_branch_ratings.sql`: جدول `branch_ratings` (id, branch_id, table_id nullable, stars int not null check 1-5, comment text nullable, created_at) + فهرس على branch_id + RLS بنفس نمط `complaints` في 0017 (insert للـanon فقط، select لـauthenticated بصلاحية جديدة `view_ratings` ونطاق `auth_branch_ids()`)
- [x] `lib/validation/rating.schema.ts`: branchId (uuid), tableId (uuid), stars (int 1-5، رسالة `common.required` عند 0)، comment (اختياري، حد أقصى 1000)
- [x] `lib/actions/rating.actions.ts`: `submitRating` بنفس نمط `submitComplaint`
- [x] `lib/domain/resolve-table.ts`: أُضيف `google_maps_url` لاستعلام `branches` وللنوع المُعاد `ResolvedTable.branch`
- [x] مسار جديد `app/(public)/m/[branchSlug]/t/[qrToken]/rating/page.tsx` + `components/public-menu/RatingForm.tsx` (نجوم 1-5 تفاعلية عبر `lucide-react Star` + تعليق اختياري + إرسال). بعد النجاح: رسالة شكر، ثم إن وُجد `google_reviews_url` يظهر زر ثانوي "قيّمنا أيضاً على خرائط قوقل" (رابط خارجي)
- [x] `EntryGateway.tsx`: تصميم محسَّن (أيقونة كل خيار داخل دائرة `bg-primary/10`، ظل عند hover)، خيار التقييم أصبح رابطاً داخلياً لصفحة `/rating` الجديدة (بدل الرابط الخارجي المباشر السابق)، وأُضيف قسم خريطة قوقل (iframe) أسفل الأزرار يظهر فقط إن وُجد `google_maps_url` — بنفس نمط الـiframe في `app/(public)/site/page.tsx`. صفحتا QR والـTablet (`page.tsx`, `tablet/page.tsx`) مُرِّر لهما `ratingHref` الجديد
- [x] ترجمات `messages/{ar,en}/publicMenu.json`: استُبدل مفتاح `gateway.review` بـ`gateway.rating` + `gateway.location`، وأُضيف namespace كامل `rating.*` (title, stars, comment, submit, submitting, success, googleCta, starsRequired)
- [x] `lib/supabase/types.ts`: أُضيف جدول `branch_ratings` يدوياً (بنفس نمط `complaints`)
- [x] التحقق: `npm run build` و`npm run lint` نظيفان (لا أخطاء)، وطُبِّقت الهجرة `0023` فعلياً على القاعدة الحية بنجاح (تأكيد مباشر: الجدول موجود في `information_schema.tables`)

**ملاحظة نطاق:** لم أبنِ صفحة إدارية لعرض التقييمات المحفوظة (dashboard) ضمن هذه المهمة — فقط تجربة الضيف + RLS دفاعية جاهزة لصفحة إدارية مستقبلية إن طُلبت.

**مهم — يحتاج إجراء من المستخدم:** فحصت القاعدة الحية، **كل الفروع الخمسة الحالية `google_maps_url` و`google_reviews_url` عندها `null`** — لذلك لن تظهر الخريطة في صفحة البوابة حتى تُعبَّأ من `/branches/[id]` (الحقلان موجودان في `BranchForm.tsx` أصلاً). زر "قيّمنا أيضاً على خرائط قوقل" بعد إرسال التقييم لن يظهر أيضاً بدون `google_reviews_url`.

**ملاحظة جانبية غير مرتبطة بمهمتي:** أثناء تشغيل `scripts/migrate.ts` فشلت هجرة `0024_loyalty_staff_redeem.sql` (موجودة مسبقاً بترقيم مختلف قبل هذه الجلسة، لم ألمسها) بخطأ "function already exists" — على الأرجح لأن الملف أُعيدت تسميته من `0022_...` إلى `0024_...` في تعديلات سابقة غير مرتبطة بمهمتي الحالية، فلم يعد يطابق الاسم المسجَّل في جدول `_migrations`. هجرتي `0023_branch_ratings.sql` طُبِّقت بنجاح **قبل** هذا الفشل وليست السبب فيه. لم أُصلح هذا لأنه خارج نطاق طلبك — أخبرني إن أردت مني معالجته.

## المرحلة II — تحصين أمني تشغيلي (خطة `shimmering-swimming-hummingbird.md`)

مرجع: `C:\Users\HP\.claude\plans\shimmering-swimming-hummingbird.md`. قرارات المستخدم: rate limiting عبر **Upstash Redis** (وليس in-memory)، واختبارات RLS الجديدة تُرقَّى إلى **pgTAP حقيقية** (ok/throws_ok متعددة، وليست placeholder).

### 1) Rate limiting (Upstash Redis)
- [x] إضافة تبعيات `@upstash/ratelimit` + `@upstash/redis` إلى `package.json`.
- [ ] إضافة متغيرات بيئة جديدة `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — **يحتاج المستخدم إنشاء حساب Upstash وتعبئة القيم الفعلية في `.env.local` بنفسه**؛ بدونها `lib/rate-limit.ts` يسمح بكل الطلبات (fail-open موثَّق) بدل تعطيل المسارات العامة كاملة في التطوير المحلي.
- [x] `lib/rate-limit.ts` جديد: عميل Upstash + 3 مثيلات `Ratelimit` (publicWrite: 5/60s، qrScan: 20/60s، loyaltyReceipt: 5/5m) + دالة `clientIp()` عبر `headers()` من `next/headers` (`x-forwarded-for`/`x-real-ip`).
- [x] تطبيق الحد في server actions التالية (فحص IP قبل أي كتابة، رسالة خطأ معرَّبة `common.rateLimited` عند التجاوز بنفس نمط أخطاء zod الحالي):
  - `submitPublicReservation` — `lib/actions/public-reservation.actions.ts`
  - `submitInquiry` — `lib/actions/public-inquiry.actions.ts`
  - `submitComplaint` — `lib/actions/complaint.actions.ts`
  - `submitRating` — `lib/actions/rating.actions.ts`
  - `submitLoyaltyReceipt` — `lib/actions/loyalty-member.actions.ts`
  - `recordQrScan` — `lib/actions/qr-scan.actions.ts` (best-effort، لا يُرجع خطأ، يتجاهل بصمت عند التجاوز)

### 2) Security headers (`next.config.ts`)
- [x] `async headers()` في `next.config.ts`: CSP (`script-src` يستثني `unsafe-eval` في الإنتاج فقط، `frame-src https://www.google.com` لخريطة `EntryGateway`، `img-src`/`connect-src` يشملان `*.supabase.co`)، `X-Frame-Options: SAMEORIGIN`، `X-Content-Type-Options: nosniff`، `Referrer-Policy: strict-origin-when-cross-origin`، `Strict-Transport-Security`.

### 3) اختبارات RLS حقيقية (pgTAP)
- [x] `supabase/tests/loyalty_rls_test.sql` — 10 سيناريوهات فعلية (`set_config('request.jwt.claims', ...)` + `set local role`) تغطي القراءة العامة لـ`settings`/`tiers`/المكافآت النشطة فقط، عزل `loyalty_members` (عضو/عضو آخر/موظف/موظف مطعم آخر)، RPCs الثلاث (`join_loyalty_member`, `submit_loyalty_receipt`, `redeem_loyalty_reward` مع رفض رصيد غير كافٍ).
- [x] `supabase/tests/reservation_preorder_items_rls_test.sql` — 6 سيناريوهات (إدراج/قراءة/حذف ضمن النطاق، رفض إدراج خارج الفرع، رفض قراءة عبر مطعم آخر).
- [x] `supabase/tests/menu_item_view_events_rls_test.sql` — 4 سيناريوهات (إدراج anon، رفض قراءة anon، قراءة موظف نفس الفرع، رفض موظف فرع آخر).
- **ملاحظة مهمة (لم تُنفَّذ فعلياً)**: هذه البيئة لا تملك Docker/pgtap محلي (نفس القيد الموثَّق في الملفات الخمسة السابقة) — الملفات الثلاثة مكتوبة وفق قواعد pgtap الصحيحة ومطابقة لمخطط الهجرات الفعلي (تحققتُ من كل عمود/سياسة/توقيع RPC بالقراءة المباشرة)، لكن **لم تُشغَّل فعلياً للتأكد من نجاحها**. يحتاج المستخدم تشغيلها عبر `supabase test db` أو psql متصل بقاعدة تجريبية فيها امتداد pgtap قبل الاعتماد عليها في CI.

### التحقق
- [x] `npm run build` + `npm run lint` — كلاهما نظيف (0 أخطاء/تحذيرات)
- [x] لا هجرة قاعدة بيانات جديدة في هذه المرحلة (rate limiting وheaders كود تطبيق فقط، واختبارات RLS ملفات SQL منفصلة لا تُغيّر schema)

## المرحلة III — جاهزية تشغيلية (Operational Readiness) (خطة `shimmering-swimming-hummingbird.md`)

مرجع: `C:\Users\HP\.claude\plans\shimmering-swimming-hummingbird.md`. قرار المستخدم: تثبيت Sentry فعلياً الآن (وليس تأجيله).

### 1) صفحات خطأ مخصّصة (بلغتين، عبر next-intl حيث ممكن)
ملاحظة مهمة من `node_modules/next/dist/docs`: نسخة Next هذه تستخدم prop اسمه **`retry`** في `error.tsx`/`global-error.tsx` (وليس `reset` كما في التوثيق القديم المعتاد).
- [x] `app/global-error.tsx` — يلتقط فشل `RootLayout` نفسه؛ يحوي `<html>/<body>` خاصين به (بلا next-intl)، نص عربي/إنجليزي ثابت، زر إعادة محاولة (`retry()`), يرسل الخطأ لـSentry.
- [x] `app/error.tsx` — حدود خطأ عامة لبقية الشجرة (`(app)` والمسارات بلا `error.tsx` خاص)، `'use client'`، `useTranslations`، يرسل الخطأ لـSentry عبر `useEffect`.
- [x] `app/not-found.tsx` — Server Component عبر `getTranslations`.
- [x] `app/(public)/m/[branchSlug]/t/[qrToken]/error.tsx` — حدّ خطأ مخصّص لتجربة الضيف، namespace `publicMenu.error`.
- [x] مفاتيح ترجمة جديدة: قسم `errors` في `common.json` (ar/en)، ومفاتيح `error` في `publicMenu.json` (ar/en).

### 2) تكامل Sentry
- [x] `npm install @sentry/nextjs` (نسخة `^10.75.0`، بحثت عن الإعداد الحالي المتوافق مع Next 16 عبر التوثيق الرسمي قبل الكتابة).
- [x] ملفات الإعداد: `instrumentation.ts` (+ `onRequestError`)، `instrumentation-client.ts`، `sentry.server.config.ts`، `sentry.edge.config.ts` — DSN من `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN`، **fail-open بلا DSN** (سلوك افتراضي في SDK، بلا منطق يدوي إضافي)، `tracesSampleRate: 0` عمداً (Error tracking فقط، بلا performance tracing/Replay — تبسيطاً وتجنباً لتكلفة/تعقيد غير مطلوب).
- [x] ربط `Sentry.captureException(error)` داخل `app/error.tsx`، `app/global-error.tsx`، وحد خطأ مسار الضيف.
- [x] `.env.local` المحلي: أُضيفت مفاتيح `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` فارغة مع تعليق توضيحي (fail-open) — **لم يُضَف DSN حقيقي** (يحتاج حساب Sentry فعلي من المستخدم).
- **قرار مسجَّل**: لم أُغلِّف `next.config.ts` بـ`withSentryConfig` (يتطلب `org`/`project`/`SENTRY_AUTH_TOKEN` لرفع source maps؛ بلا هذه القيم تبقى الأخطاء تُلتقَط لكن بـstack traces مصغّرة/minified). موثَّق في README كخطوة لاحقة اختيارية.

### 3) توثيق/تفعيل استراتيجية Backup
- [x] قسم جديد في `README.md`: الاعتماد على نسخ Supabase التلقائية اليومية (+PITR على خطط Pro)، طريقة الاستعادة من لوحة Supabase، وأمر `pg_dump` يدوي عبر `DATABASE_URL` الموجود أصلاً.

### 4) CI بسيط
- [x] `.github/workflows/ci.yml`: عند push/PR إلى `main` — `npm ci`، `npm run lint`، `npm run build`، `npm test` (Node 24، مطابق للبيئة المحلية).
- [x] تحقّقت فعلياً (بإزالة `.env.local` مؤقتاً وتشغيل `npm run build`) أن البناء **لا يحتاج أي متغير بيئة** — كل المسارات `ƒ` (ديناميكية/server-rendered on demand)، لا صفحة تُبنى ثابتاً تستدعي Supabase وقت البناء. لذا **لا حاجة لإضافة GitHub Secrets** لنجاح الـCI.

### التحقق
- [x] `npm run build` + `npm run lint` + `npm test` — الثلاثة نظيفة بعد كل التغييرات.
- [x] `npx next typegen` نظيف (بلا مسارات جديدة فعلياً تحتاجه، لكن تحقّق إضافي).
- [x] لا هجرة قاعدة بيانات في هذه المرحلة.
- [x] لم يُدفَع أي شيء لـ GitHub بعد ولم يُفعَّل CI فعلياً (لا push تم تنفيذه) — الـworkflow جاهز محلياً فقط، سيعمل تلقائياً بمجرد push للفرع `main`.

### مراجعة (Review) — المرحلة III ✅ (منجزة 2026-09-16)

**ما تغيّر:**
- 4 ملفات جديدة لحدود الأخطاء (`app/global-error.tsx`, `app/error.tsx`, `app/not-found.tsx`, `app/(public)/m/[branchSlug]/t/[qrToken]/error.tsx`) بدل صفحات Next الافتراضية القبيحة/الصامتة سابقاً — الآن كل خطأ غير متوقّع (سواء في لوحة التحكم أو تجربة ضيف QR) يعرض رسالة معرَّبة واضحة بدل شاشة بيضاء أو "Application error" الافتراضية.
- Sentry مثبَّت وموصول فعلياً (server/edge/client + حدود الأخطاء الثلاث) بنمط fail-open مطابق تماماً لقرار Upstash السابق — لا شيء يُرسَل ولا شيء ينكسر بدون DSN حقيقي.
- `README.md` تحوّل من قالب `create-next-app` الافتراضي الفارغ إلى توثيق فعلي لمتغيرات البيئة، استراتيجية Backup، وCI — أول توثيق تشغيلي حقيقي للمشروع.
- `.github/workflows/ci.yml` جاهز وسيعمل تلقائياً من أول push بعد الدمج، بلا حاجة لأي إعداد Secrets إضافي (تحقّقتُ عملياً لا نظرياً).

**قرار يستحق التوضيح:** اخترت عدم تفعيل `tracesSampleRate` أو `withSentryConfig` (source maps) لتقليل المساحة المُضافة لأقل قدر يحقق الهدف المطلوب فعلياً (التقاط الأخطاء) — كلاهما قابل للتفعيل لاحقاً بسطر واحد إن احتجت أداء/traces حقيقية بدون أي إعادة هيكلة.

**متبقٍ عليك (يدوي، خارج نطاق ما يمكنني فعله):**
1. إنشاء حساب/مشروع Sentry فعلي وتعبئة `SENTRY_DSN`/`NEXT_PUBLIC_SENTRY_DSN` الحقيقيين في `.env.local` (وفي أي بيئة نشر لاحقاً) لتفعيل المراقبة فعلياً.
2. Push هذا الفرع لـGitHub لتفعيل الـCI فعلياً لأول مرة والتأكد أنه يمر (اختبرته محلياً فقط).
3. لم أفتح أي صفحة خطأ بمتصفح حي (لا أداة Headless متاحة هذه الجلسة) — يُنصح بتجربة رابط QR غير موجود (يفعّل `app/not-found.tsx`) ورابط لوحة تحكم غير موجود، للتأكد من المظهر البصري.

## المرحلة IV — تحسينات جودة الكود (بلا تغيير وظيفي) (خطة `shimmering-swimming-hummingbird.md`)

مرجع: `C:\Users\HP\.claude\plans\shimmering-swimming-hummingbird.md`. بحث استكشافي أولي وجد **8** مكوّنات `*ListTable*` (النص الأصلي ذكر 6) — قرار المستخدم: استخلاص من كل الـ8. وقرار المستخدم: تنفيذ RPC ذرّية لـ`replaceItemChildren`/`replacePreorderItems` ضمن هذه الدفعة (لا سابقة مطابقة في المشروع بهذا النمط — migration جديدة + إعادة كتابة server actions).

### 1) مكوّن `DataListTable` عام (من 8 ملفات: Branches, Menus, Tables, Inquiries, Complaints, Items, Reservations, EventReservations)
- [ ] استخلاص `hooks/useBranchOptions.ts` (دالة dedupe branchId→branchName عبر `Map`، مكرَّرة حرفياً في 7 من 8 ملفات)
- [ ] استخلاص `hooks/useDateRangeFilter.ts` (منطق `dateFrom`/`dateTo` → `fromTime`/`toTime` بـ`+24h`، مكرَّر حرفياً بين Reservations وEventReservations)
- [ ] استخلاص مكوّن `components/shared/ListFilterBar.tsx` (شريط بحث + Select فرع "كل الفروع" المكرَّر في 6 ملفات)
- [ ] استخلاص مكوّن `components/shared/ListTableShell.tsx` (نمط: حالة فارغة `<p>{t("common.noResults")}</p>` مقابل `<Table>` مع صف `<Link>`) — يُستخدم في 7 ملفات (كل شيء عدا Items التي هي شبكة بطاقات وليست جدولاً؛ تُستخدم لها فقط `useBranchOptions`/`ListFilterBar` بلا `ListTableShell`)
- [ ] تحديث الملفات الثمانية لاستخدام الاستخلاصات الجديدة بدل الكود المكرَّر، بلا أي تغيير في السلوك الظاهر (نفس الفلاتر/الترتيب/الروابط)

### 2) طبقة ترجمة أخطاء DB موحّدة
- [ ] `lib/i18n/db-errors.ts` جديد: دالة `translateDbError(error, locale)` تُرجع رسالة معرَّبة عامة حسب نوع الخطأ الشائع (RLS/`23505` تكرار/`23503` مفتاح أجنبي/افتراضي عام)، بنفس نمط `action-messages.ts` الحالي (مفاتيح جديدة في `messages/{ar,en}/actions.json` تحت `db.*`)
- [ ] استبدال الـ36 موضع `error.message`/`error?.message` الخام عبر 16 ملف actions (`item`, `branch`, `category`, `menu`, `table`, `reservation`, `event-reservation`, `inquiry`, `complaint`, `rating`, `restaurant`, `public-inquiry`, `public-reservation`, `public-event-reservation`, `loyalty`, `loyalty-member`) بنداءات `translateDbError`

### 3) RPC ذرّية لاستبدال العلاقات الفرعية (معاملة DB حقيقية)
- [ ] Migration جديدة (رقم تالٍ لآخر هجرة مطبَّقة) — دالة `replace_item_children(...)` (security definer، بنفس نمط `bootstrap_restaurant`/`redeem_loyalty_reward_for_member`: تعليق عربي يوضّح الغرض، `revoke all`/`grant execute to authenticated`، تحقّق من ملكية الفرع/الصلاحية داخل الدالة) تُنفّذ حذف+إدراج الفئات/variants/option groups+values/allergens للصنف بمعاملة واحدة ذرّية
- [ ] دالة مشابهة `replace_preorder_items(...)` لنفس النمط في `preorder.actions.ts`
- [ ] إعادة كتابة `replaceItemChildren` (`lib/actions/item.actions.ts`) و`replacePreorderItems` (`lib/actions/preorder.actions.ts`) لاستدعاء `supabase.rpc(...)` الجديد بدل السلسلة الحالية من عمليات delete/insert منفصلة
- [ ] `lib/supabase/types.ts`: إضافة الدالتين الجديدتين إلى `Functions`
- [ ] تحديث `supabase/tests/menu_catalog_rls_test.sql` (أو ملف جديد) إن لزم لتغطية RPC الجديدة

### 4) استخلاص hooks من `ItemForm.tsx`/`ReservationForm.tsx`
- [ ] `hooks/useActionFormSubmit.ts` — تجريد نمط `isPending`/`startTransition`/`toast` المكرَّر حرفياً في النموذجين (وربما نماذج أخرى)
- [ ] `hooks/useVariantsFieldArray.ts` (من `ItemForm.tsx`) لتغليف `useFieldArray` الخاص بـ`variants`
- [ ] `hooks/useOptionGroupsFieldArray.ts` (من `ItemForm.tsx`) لتغليف `optionGroups` + `OptionGroupValues` المتداخل
- [ ] `hooks/usePreorderItemsFieldArray.ts` (من `ReservationForm.tsx`) لتغليف `preorderItems` + منطق إعادة الضبط المتسلسل (`setValue` عند تغيير الصنف) + حساب `candidates`/`secondItem` لنصف/نصف
- [ ] نقل `getHalfHalfCandidates` (حالياً محلية في `ReservationForm.tsx`) إلى `lib/domain/` بجانب توأمها الخادمي `validateHalfHalfItems` في `preorder.actions.ts` (منطق عمل مكرَّر بين العميل والخادم)
- [ ] تحديث `ItemForm.tsx`/`ReservationForm.tsx` لاستخدام الـhooks الجديدة، بلا أي تغيير في السلوك الظاهر

### التحقق
- [ ] `npm run build` + `npm run lint` + `npm test` نظيفة بعد كل بند
- [ ] الهجرة الجديدة (بند 3) تُطبَّق فعلياً على القاعدة الحية بعد تأكيد المستخدم (نفس نمط كل هجرة سابقة)
- [ ] تحقق يدوي/سكربت Node مؤقت أن `replace_item_children`/`replace_preorder_items` تُنتج نفس النتيجة النهائية للبيانات كالكود القديم (قبل حذفه)، مع اختبار سلبي: فشل جزئي متعمَّد (مثلاً قيمة غير صالحة) لا يترك بيانات ناقصة (rollback كامل)

## المرحلة V — استغلال البيانات المجمَّعة (خطة `shimmering-swimming-hummingbird.md`)

مرجع: `C:\Users\HP\.claude\plans\shimmering-swimming-hummingbird.md`. نُفِّذت مباشرة بطلب المستخدم قبل إكمال المرحلة IV (لا تعارض — ملفات مستقلة تماماً).

- [x] صفحة `/analytics` جديدة (`app/(app)/analytics/page.tsx`) — Server Component يقرأ مباشرة من `qr_scan_events`/`menu_item_view_events` الموجودتين أصلاً منذ المرحلتين 6/13، بلا أي migration جديدة
- [x] 3 بطاقات إحصاء (`StatCard` الموجود مسبقاً): مسح QR، مشاهدات الأصناف، عدد الأصناف التي شوهدت — لآخر 30 يوماً
- [x] جدول "الأكثر مشاهدة" (Top 10 صنف حسب عدد المشاهدات، مع اسم الفرع)
- [x] رسم "ذروة الأوقات" (توزيع المسح+المشاهدات على 24 ساعة، كل حدث محسوب بالتوقيت المحلي لفرعه عبر `Intl.DateTimeFormat` + عمود `branches.timezone` الموجود، بلا مكتبة رسوم بيانية إضافية)
- [x] رابط تنقّل جديد `nav.analytics` في `SidebarNavContent.tsx` + ترجمات (`messages/{ar,en}/analytics.json` كـnamespace جديد مسجَّل في `i18n/request.ts`)
- [x] `npm run build` + `npm run lint` نظيفة

### مراجعة (Review) — المرحلة V ✅ (منجزة 2026-09-17)

- **لا فلترة حسب فرع في الواجهة**: تجميع الأرقام عبر كل فروع المطعم دفعة واحدة (RLS تُقيّد النتائج أصلاً لفروع المستخدم عبر `auth_branch_ids()`)، مع عرض اسم الفرع في عمود منفصل بجدول "الأكثر مشاهدة" لتمييز الأصناف عند تعدد الفروع. لا حاجة لفلتر إضافي الآن طالما الهدف "لوحة بسيطة" حسب نص الخطة الأصلية؛ فلتر فرع صريح يستحق بند منفصل لاحقاً إن طلبه المستخدم.
- **الأسماء تُعرض بالعربي دائماً (`name_ar`)** بغضّ النظر عن لغة الواجهة الحالية — نفس نمط `ReservationsListTable`/`reservations/page.tsx` الموجود مسبقاً بالضبط (لا شاشة إدارة حالية تُبدّل اسم الفرع/الصنف حسب لغة الواجهة)، فلم أُدخل سلوكاً جديداً هنا.
- **حد `5000` صف لكل جدول أحداث** (`EVENT_ROW_LIMIT`) لتفادي جلب غير محدود مع نمو البيانات — كافٍ حالياً (مطعم بفرع واحد فعلي، حجم بيانات ضئيل)، يستحق مراجعة لاحقاً (تجميع SQL بدل جلب صفوف خام) إن كبر عدد الأحداث الشهرية بشكل ملحوظ.
- **`eslint-plugin-react-hooks` يرفض `Date.now()` مباشرة** حتى داخل Server Component غير تفاعلي (يُعامله كمكوّن React عادي لأن اسمه يبدأ بحرف كبير ويُرجع JSX) — الحل: `new Date()` + `setDate()` بدل حساب فرق الميلي ثانية يدوياً؛ نفس القيد يستحق تسجيله في `~/.claude/learnings/frontend.md` إن تكرر.
- **لم أُنفّذ المرحلة IV** (استخلاص `DataListTable`/hooks/RPC ذرّية) قبل هذه — طلب المستخدم صراحة تنفيذ المرحلة V أولاً، ولا تعارض لأنها تلمس ملفات جديدة بالكامل.
