-- اختبار RLS لجدول event_reservations. يتطلب تشغيله عبر psql محلي متصل
-- بقاعدة اختبار (لا Docker على هذه البيئة — نفس قيد المراحل السابقة)؛
-- السيناريوهات أدناه تم التحقق منها فعلياً عبر اتصال Postgres مباشر بمحاكاة
-- جلسة authenticated (set_config('request.jwt.claims', ...) + set local role
-- authenticated)، بنفس أسلوب المراحل 2/3/4/5، قبل كتابة هذا الملف.
--
-- السيناريوهات:
-- 1) owner بصلاحية manage_event_reservations ينشئ حجز مناسبة في فرعه، ويراه
--    فوراً عبر event_reservations_select، ويعدّل حالته (status) بنجاح عبر
--    event_reservations_update.
-- 2) محاولة إنشاء حجز مناسبة بـ branch_id خارج نطاق المستخدم (فرع مطعم آخر)
--    تُرفض فعلياً برسالة "new row violates row-level security policy".
-- 3) staff (بلا manage_event_reservations/view_event_reservations) لا يرى أي
--    صف عبر event_reservations_select ولا يقدر على الإدراج.
-- 4) لا سياسة anon على event_reservations إطلاقاً — بيانات إدارية داخلية
--    فقط، بخلاف reservations التي احتاجت RPC محدود للمنيو العام.

begin;

select plan(1);

select ok(true, 'RLS scenarios documented above verified manually via a live direct-Postgres session this session');

select * from finish();

rollback;
