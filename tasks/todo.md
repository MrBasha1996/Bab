# Digital Menu Platform — خطة التنفيذ (Phase B → Implementation)

مرجع التحليل الكامل (Phase A، معتمَد): `C:\Users\HP\.claude\plans\26-digital-menu-rippling-bird.md`

مشروع جديد ومنفصل تماماً في `C:\Users\HP\Bab`، بمعمارية DealzTree ERP (Next.js + Supabase + shadcn/ui) مع دعم لغتين كامل (`_ar`/`_en`) — **لا علاقة له بـ `BabApp`** (مشروع Expo/Prisma منفصل تماماً، تم التأكيد صراحة).

---

## المرحلة 0 — تأسيس المشروع

- [ ] `create-next-app` (TypeScript, App Router, Tailwind, ESLint) في `C:\Users\HP\Bab`
- [ ] تثبيت: `@supabase/ssr @supabase/supabase-js next-intl react-hook-form zod @hookform/resolvers qrcode radix-ui next-themes lucide-react`
- [ ] نسخ `components/ui/*` حرفياً من `DealzTree ERP` (label, button, input, card, table, dialog, form, page-header, stat-card, riyal-amount... حسب الحاجة الفعلية فقط)
- [ ] نسخ نمط `lib/utils.ts` (دالة `cn`)
- [ ] إعداد `i18n/request.ts` بنفس آلية DealzTree (locale من profile→cookie→default، namespaces منفصلة، deepMerge) — namespaces أولية: `common, nav, tables, menus, categories, items, reservations, settings`
- [ ] `app/layout.tsx`: خط Cairo (عربي) + خط لاتيني واضح (مثل Inter) للإنجليزية، `dir` ديناميكي، `Direction.Provider`، `NextIntlClientProvider`
- [ ] `CLAUDE.md` أولي يوثّق التقنية/البنية (تعليمات المستخدم الدائمة)
- [ ] التحقق: `npm run dev` يعمل بصفحة رئيسية فارغة بدون أخطاء

## المرحلة 1 — Supabase + Auth + الأدوار

- [ ] إنشاء مشروع Supabase (أو الربط بمشروع موجود يحدده المستخدم)
- [ ] `lib/supabase/{server,client,admin,middleware}.ts` (نسخ نمط DealzTree، تعديل الأسماء فقط)
- [ ] `proxy.ts` لتحديث الجلسة وحماية `app/(app)/*`
- [ ] Migration `0001_roles_profiles.sql`: `roles(key, scope_type, is_system)`, `role_capabilities`, `profiles(id, restaurant_id, branch_id, role_id, locale)`
- [ ] دالة `auth_branch_ids()` (SECURITY DEFINER)
- [ ] `lib/auth/{getProfile,guards}.ts`
- [ ] التحقق: تسجيل دخول تجريبي + قراءة بروفايل تعمل

## المرحلة 2 — المطعم/الفرع (Restaurant/Branch)

- [ ] Migration `0002_restaurants_branches.sql` (RLS كاملة من البداية، بنمط `branch_id = any(auth_branch_ids())`)
- [ ] `lib/validation/{restaurant,branch}.schema.ts` + `lib/actions/{restaurant,branch}.actions.ts`
- [ ] صفحات `app/(app)/restaurants/{list,new,[id]}` و`branches` بنمط `page-header.tsx` + `grid gap-6`
- [ ] اختبار RLS: `supabase/tests/branches_rls_test.sql`
- [ ] التحقق: إنشاء مطعم وفرع من الواجهة فعلياً

## المرحلة 3 — الطاولات + QR

- [ ] Migration `0003_tables_qr.sql`: `tables`, `table_qr_codes(qr_token unique عشوائي)`
- [ ] `lib/actions/table.actions.ts` (إنشاء/تعديل طاولة، توليد/إعادة توليد/تعطيل QR)
- [ ] توليد صورة QR عبر `qrcode` مشفّرة للرابط `/m/[branchSlug]/t/[qrToken]`
- [ ] صفحة `Tables/[id]`: عرض/تحميل/طباعة/إعادة توليد/تعطيل QR
- [ ] اختبار RLS + اختبار أن إعادة التوليد تُبطل الرابط القديم فعلياً
- [ ] التحقق: توليد QR فعلي وفتح رابطه يدوياً (حتى قبل بناء صفحة المنيو العامة، تأكيد أن التوكن يُحل بشكل صحيح عبر استعلام مباشر)

## المرحلة 4 — كتالوج المنيو (Menus/Categories/Items)

- [ ] Migration `0004_menu_catalog.sql`: `menus, menu_schedules, menu_categories, menu_items, menu_category_items, item_variants, option_groups, option_values, allergens, item_allergens` — كل حقل نصي عميل بعمودين `_ar`/`_en` إلزاميين
- [ ] Supabase Storage bucket `menu-images` بالمسار المتفق عليه
- [ ] `lib/domain/menu-schedule.ts` + اختبارات وحدة (عادي/عابر لمنتصف الليل/بلا جدولة)
- [ ] `lib/validation/{menu,category,item,option-group}.schema.ts` (يفرض `_ar`+`_en` معاً)
- [ ] `lib/actions/{menu,category,item}.actions.ts`
- [ ] صفحات الإدارة: `Menus/{list,new,[id]}`, `Menus/[id]/Categories`, `Categories/[id]/Items`, نموذج صنف كامل (صورة، وصف، سعر، مكونات، variants، option groups/values، allergens)
- [ ] زر "غير متوفر" سريع (`toggle_item_availability` بصلاحية أخف)
- [ ] اختبار RLS: القراءة العامة (anon) لا ترى `is_available=false`/`visible=false`، ولا تكتب شيئاً إطلاقاً
- [ ] التحقق: إنشاء منيو + فئة + صنف كامل الحقول بنجاح

## المرحلة 5 — الحجز المبسّط (MVP)

- [ ] Migration `0005_reservations.sql`: `customers, reservations` (بدون Pre-order — مؤجَّل عمداً وموثَّق في الكود بتعليق موجز)
- [ ] `lib/actions/reservation.actions.ts` (إنشاء/عرض فقط، بدون تدفق حجز كامل)
- [ ] التحقق: حجز تجريبي مربوط بطاولة يظهر لاحقاً في صفحة QR الخاصة بنفس الطاولة

## المرحلة 6 — واجهة المنيو العامة (QR + Tablet)

- [ ] Migration `0006_menu_events.sql`
- [ ] Route عام: `app/(public)/m/[branchSlug]/t/[qrToken]/page.tsx` — حل التوكن، عرض الترحيب + رقم الطاولة + بيانات الحجز إن توفرت
- [ ] اكتشاف لغة تلقائي (`Accept-Language`) + fallback عربي + زر تبديل يُخزَّن بكوكي
- [ ] عرض القوائم النشطة الآن حسب `menu_schedules` (توقيت الفرع)
- [ ] تصفح Categories → Items → Item Details (صورة، وصف، سعر، variants، options، allergens)، بحث، إخفاء غير المتوفر
- [ ] تسجيل حدث `qr_scan` عند الفتح
- [ ] Route منفصل Tablet: `.../tablet/page.tsx` (Full Screen، بلا أي عنصر إدارة)
- [ ] مكوّن `ActionBar` فارغ/معطّل (نقطة توسّع مستقبلية موثّقة، بلا منطق فعلي)
- [ ] التحقق اليدوي الكامل (انظر قسم التحقق أدناه)

## المرحلة 7 — مراجعة نهائية

- [ ] `next build` + `eslint` + `tsc --noEmit` خضراء
- [ ] مراجعة أمنية سريعة: لا اعتماد على إخفاء واجهة، RLS مُختبَرة على كل جدول، QR token غير قابل للتخمين فعلياً (طول كافٍ + عشوائية تشفيرية)
- [ ] تحديث قسم Review في هذا الملف بملخص ما تم وأي ملاحظات

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

## Review (يُملأ بعد الانتهاء)

_لم يبدأ التنفيذ بعد._
