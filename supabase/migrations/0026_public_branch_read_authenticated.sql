-- إصلاح: branches_select_public/restaurants_select_public (هجرة 0008) تمنحان
-- صلاحية القراءة لدور anon فقط. بمجرد أن يسجّل عميل ولاء دخوله فعلياً عبر
-- Google (منذ هجرة 0019)، يتحوّل دوره إلى authenticated، فتتوقف عن انطباق
-- سياسة anon عليه ويُطبَّق بدلاً منها restaurants_select/branches_select
-- (هجرتا 0002/0003) المقيَّدتان بموظفي المطعم فقط عبر جدول profiles — عميل
-- الولاء ليس موظفاً فلا يملك صف profiles، فتُرجع الاستعلامات صفراً من الصفوف
-- ويُرجع resolveBranch()/resolveTable() null، فتُعرض صفحة الولاء العامة 404
-- دائماً لأي عميل حقيقي مسجَّل دخول (اكتُشف عبر اختبار E2E حي بجلسة Supabase
-- حقيقية غير-موظفة — الاختبارات السابقة استخدمت service_role أو محاكاة JWT
-- فلم تصطدم بهذا القيد). الحل: سياسة select إضافية بنفس شرط anon تماماً لكن
-- لدور authenticated العام، فتغطي كلا النوعين من الزوار بلا تكرار منطق.

create policy branches_select_public_authenticated on public.branches
  for select to authenticated using (deleted_at is null);

create policy restaurants_select_public_authenticated on public.restaurants
  for select to authenticated using (deleted_at is null);
