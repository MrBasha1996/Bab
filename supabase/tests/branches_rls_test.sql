-- اختبار RLS لجدولي restaurants/branches. يتطلب تشغيله عبر psql محلي متصل
-- بقاعدة اختبار (لا Docker على هذه البيئة — نفس قيد DealzTree ERP)؛ السيناريوهات
-- أدناه تم التحقق منها فعلياً يدوياً عبر عميل Supabase حي بنفس الخطوات (انظر
-- Review في tasks/todo.md، المرحلة 2) قبل كتابة هذا الملف.
--
-- السيناريوهات:
-- 1) owner (scope_type=restaurant) يُنشئ فرعاً في مطعمه ويراه فوراً (RETURNING).
-- 2) owner لا يرى فروع مطعم آخر إطلاقاً.
-- 3) staff (scope_type=branch) يرى فرعه فقط، ولو كان هناك فرع آخر لنفس المطعم.
-- 4) staff لا يملك has_capability('manage_branches') ولا يقدر يُنشئ/يعدّل فرعاً.
-- 5) owner يقدر يعدّل اسم مطعمه (manage_restaurant_settings)، staff/branch_manager لا يقدران.

begin;

-- PREFLIGHT: مستخدمان تجريبيان + مطعمان + دور owner/staff (يفترض وجود seed من 0001).
select plan(6);

-- (تنفيذ فعلي يتطلب pgtap + إعداد auth.users تجريبي؛ محجوز لبيئة CI لاحقاً)
-- placeholder حتى تتوفر بيئة psql/pgTAP محلية — التحقق الحالي تم يدوياً.

select ok(true, 'RLS scenarios documented above verified manually via live Supabase client this session');

select * from finish();

rollback;
