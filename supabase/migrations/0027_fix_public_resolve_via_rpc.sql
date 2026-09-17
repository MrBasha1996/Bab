-- تصحيح لهجرة 0026: السياستان المضافتان هناك (select عام لـauthenticated على
-- branches/restaurants) صحّحتا مشكلة عملاء الولاء الحقيقيين لكن بأثر جانبي
-- خطير — سياسات RLS لنفس العملية (select) لنفس الدور تُدمَج بعملية OR، فأي
-- سياسة "authenticated بلا شرط مطعم" تُبطل عملياً عزل branches_select/
-- restaurants_select بين المطاعم لكل الموظفين أيضاً (يرى موظف مطعم فروع مطعم
-- آخر بالكامل). اكتُشف هذا فوراً عبر نفس اختبارات E2E (اختبار تسجيل الدخول
-- بدأ يفشل بخطأ RLS على customers لأن نموذج الحجز أظهر فرعاً من مطعم مختلف).
drop policy branches_select_public_authenticated on public.branches;
drop policy restaurants_select_public_authenticated on public.restaurants;

-- البديل الصحيح: بنفس نمط get_table_reservation (هجرة 0008) — دالة
-- security definer تتحقق من صحة المُدخلات ثم تُرجع فقط الأعمدة العامة
-- اللازمة، بلا حاجة لأي سياسة RLS إضافية على branches/restaurants/tables/
-- table_qr_codes (تبقى كما هي: anon للزوار المجهولين، staff-scoped
-- للموظفين). resolveBranch()/resolveTable() في التطبيق يستدعيان هذه الدوال
-- بدل القراءة المباشرة، فيعملان بنفس الطريقة سواء كان الزائر anon أو عميل
-- ولاء authenticated غير موظف.
create function public.resolve_branch_public(p_branch_slug text)
returns table (
  branch_id uuid,
  branch_name_ar text,
  branch_name_en text,
  restaurant_id uuid,
  restaurant_name_ar text,
  restaurant_name_en text,
  restaurant_logo_url text
)
language sql
security definer
stable
set search_path = public
as $$
  select b.id, b.name_ar, b.name_en, r.id, r.name_ar, r.name_en, r.logo_url
  from public.branches b
  join public.restaurants r on r.id = b.restaurant_id
  where b.slug = p_branch_slug and b.deleted_at is null;
$$;

create function public.resolve_table_public(p_branch_slug text, p_qr_token text)
returns table (
  restaurant_id uuid,
  restaurant_name_ar text,
  restaurant_name_en text,
  restaurant_logo_url text,
  branch_id uuid,
  branch_name_ar text,
  branch_name_en text,
  branch_timezone text,
  branch_slug text,
  branch_google_reviews_url text,
  branch_google_maps_url text,
  table_id uuid,
  table_label_ar text,
  table_label_en text,
  qr_code_id uuid
)
language sql
security definer
stable
set search_path = public
as $$
  select
    r.id, r.name_ar, r.name_en, r.logo_url,
    b.id, b.name_ar, b.name_en, b.timezone, b.slug, b.google_reviews_url, b.google_maps_url,
    t.id, t.label_ar, t.label_en,
    qr.id
  from public.table_qr_codes qr
  join public.tables t on t.id = qr.table_id
  join public.branches b on b.id = qr.branch_id
  join public.restaurants r on r.id = b.restaurant_id
  where qr.qr_token = p_qr_token
    and qr.is_active = true
    and b.slug = p_branch_slug
    and t.deleted_at is null
    and b.deleted_at is null;
$$;

grant execute on function public.resolve_branch_public(text) to anon, authenticated;
grant execute on function public.resolve_table_public(text, text) to anon, authenticated;
