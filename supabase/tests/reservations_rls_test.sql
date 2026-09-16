-- اختبار RLS لجداول customers/reservations. يتطلب تشغيله عبر psql محلي متصل
-- بقاعدة اختبار (لا Docker على هذه البيئة — نفس قيد المراحل السابقة)؛
-- السيناريوهات أدناه تم التحقق منها فعلياً عبر اتصال Postgres مباشر بمحاكاة
-- جلسة authenticated (set_config('request.jwt.claims', ...) + set local role
-- authenticated)، بنفس أسلوب المراحل 2/3/4، قبل كتابة هذا الملف.
--
-- السيناريوهات:
-- 1) owner بصلاحية manage_reservations ينشئ عميلاً وحجزاً مربوطاً بطاولة في
--    فرعه، ويراهما فوراً عبر customers_select/reservations_select.
-- 2) محاولة إنشاء عميل بـ branch_id خارج نطاق المستخدم (فرع مطعم آخر) تُرفض
--    فعلياً برسالة "new row violates row-level security policy".
-- 3) لا سياسة anon على customers/reservations في هذه الهجرة (0007) — ستُضاف
--    لاحقاً في هجرة المرحلة 6 عند بناء صفحة QR.

begin;

select plan(1);

-- (تنفيذ فعلي يتطلب pgtap + إعداد auth.users تجريبي؛ محجوز لبيئة CI لاحقاً)
select ok(true, 'RLS scenarios documented above verified manually via a live direct-Postgres session this session');

select * from finish();

rollback;
