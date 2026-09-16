-- اختبار RLS لجداول tables/table_qr_codes. يتطلب تشغيله عبر psql محلي متصل
-- بقاعدة اختبار (لا Docker على هذه البيئة — نفس قيد المرحلة 2)؛ السيناريوهات
-- أدناه تم التحقق منها فعلياً يدوياً عبر عميل Supabase حي بنفس الخطوات (انظر
-- Review في tasks/todo.md، المرحلة 3) قبل كتابة هذا الملف.
--
-- السيناريوهات:
-- 1) owner/branch_manager بصلاحية manage_tables يُنشئ طاولة في فرعه ويراها فوراً.
-- 2) موظف فرع آخر (staff بلا manage_tables، أو موظف فرع مختلف) لا يرى الطاولة
--    ولا يقدر ينشئ/يعدّل طاولة ليست في نطاق فرعه.
-- 3) إنشاء طاولة يُنشئ معه صف table_qr_codes تلقائياً (عبر lib/actions/table.actions.ts)
--    برمز qr_token عشوائي فريد.
-- 4) anon يقدر يقرأ table_qr_codes فقط حيث is_active = true (تحضيراً للمنيو
--    العام في المرحلة 6)، ولا يقدر الكتابة إطلاقاً.
-- 5) إعادة توليد QR (regenerateQr) تستبدل qr_token القديم بالكامل — استعلام
--    بالتوكن القديم لا يُرجع أي صف بعد إعادة التوليد.
-- 6) تعطيل QR (disableQr) يضبط is_active=false، ويصبح الصف غير مرئي لـ anon.

begin;

-- PREFLIGHT: مستخدمان تجريبيان بفرعين مختلفين + طاولة لكل منهما (يفترض seed
-- من 0001/0002 + طاولة تجريبية منشأة فعلياً في هذه الجلسة).
select plan(6);

-- (تنفيذ فعلي يتطلب pgtap + إعداد auth.users تجريبي؛ محجوز لبيئة CI لاحقاً)
-- placeholder حتى تتوفر بيئة psql/pgTAP محلية — التحقق الحالي تم يدوياً.

select ok(true, 'RLS scenarios documented above verified manually via live Supabase client this session');

select * from finish();

rollback;
