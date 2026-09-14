@AGENTS.md

# Digital Menu Platform (bab-digital-menu)

مشروع مستقل تماماً — منصة Digital Menu (تابلت + QR للطاولات) لا علاقة له بـ `BabApp` (مشروع Expo/Prisma منفصل).

راجع خطة التنفيذ الكاملة: `tasks/todo.md`
مرجع التحليل المعتمد (Phase A): `C:\Users\HP\.claude\plans\26-digital-menu-rippling-bird.md`

## التقنية
- **Next.js (App Router, TypeScript, Turbopack)** + **Supabase** (Postgres + Auth + RLS)
- Tailwind CSS + shadcn/ui (Radix UI base) — واجهة ثنائية اللغة كاملة (عربي/إنجليزي)، RTL/LTR ديناميكي حسب اللغة المختارة
- `next-intl` لواجهة الإدارة (chrome)؛ محتوى المنيو (أسماء/أوصاف الأصناف) يُخزَّن بعمودين `_ar`/`_en` في قاعدة البيانات (ليس عبر next-intl)
- `react-hook-form` + `zod` للنماذج والتحقق
- `@supabase/ssr` لعملاء Supabase (server/browser/middleware)
- `qrcode` لتوليد رموز QR للطاولات

## هيكل المشروع
- `app/(auth)/login` — تسجيل الدخول
- `app/(app)/*` — لوحة تحكم المطعم (محمية عبر `proxy.ts` + `layout.tsx`)
- `app/(public)/m/[branchSlug]/t/[qrToken]/...` — منيو QR العامة (بلا مصادقة، توكن عشوائي غير قابل للتخمين)
- `app/(public)/m/[branchSlug]/t/[qrToken]/tablet/...` — وضع التابلت (Full Screen، بلا عناصر إدارة)
- `lib/supabase/{server,client,admin,middleware}.ts`
- `lib/auth/{getProfile,guards}.ts`
- `lib/domain/menu-schedule.ts` — منطق تحديد المنيو النشط الآن حسب الوقت (يعالج الفترات العابرة لمنتصف الليل)
- `lib/actions/*.actions.ts` — Server Actions
- `lib/validation/*.schema.ts` — مخططات zod
- `supabase/migrations/*.sql` — مرقّمة، لا تُعدَّل بعد التطبيق
- `supabase/tests/*.sql` — اختبارات RLS
- `i18n/request.ts` + `messages/{ar,en}/*.json` — namespaces منفصلة لكل موديول

## البنية الهرمية للبيانات
```
Restaurant → Branch → Tables → QR Codes
                    → Menus → Schedules
                            → Categories → menu_category_items (N:N) → Items
                                                                          → Variants
                                                                          → Option Groups → Option Values
                                                                          → Allergens
                    → Reservations (MVP مبسّط، بدون Pre-order)
```

## الأدوار (RBAC)
جدول `roles(key, scope_type[none|restaurant|branch], is_system)` + `role_capabilities` (ليس enum). أدوار أولية: `owner` (كل فروع المطعم) · `branch_manager` (فرع واحد) · `staff` (فرع واحد، صلاحيات محدودة). RLS هي خط الدفاع الحقيقي دائماً عبر `auth_branch_ids()` — لا اعتماد على إخفاء عناصر الواجهة.

## قواعد
- كل كود جديد بدون تعليقات إلا عند ضرورة توضيح سبب غير بديهي
- أي شاشة CRUD جديدة تتبع نمط: `lib/validation/<entity>.schema.ts` + `lib/actions/<entity>.actions.ts` + `components/<entity>/<Entity>Form.tsx` + صفحات `list/new/[id]`
- أي تعديل على المخطط يذهب في هجرة جديدة (لا تُعدَّل هجرة سابقة بعد تطبيقها)
- كل جدول جديد ذو `branch_id` يحمله مباشرة (denormalized) وله RLS من نفس الهجرة، مع اختبار SQL مرافق
- كل حقل نصي يظهر في المنيو العامة (اسم صنف/فئة/وصف/مكونات) يُخزَّن بعمودين `_ar` و`_en` إلزاميين

## التشغيل
```bash
npm run dev      # تطوير محلي (Turbopack)
npm run build    # بناء إنتاجي + فحص الأنواع
npm run lint     # ESLint
```
