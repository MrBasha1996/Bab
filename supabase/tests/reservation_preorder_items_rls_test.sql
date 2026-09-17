-- اختبار RLS حقيقي (pgTAP) لجدول reservation_preorder_items (هجرة 0012).
-- يتطلب تشغيله عبر بيئة تملك امتداد pgtap فعلياً (مثلاً `supabase test db`
-- محلياً، أو psql متصل بقاعدة تجريبية فيها الامتداد) — هذه البيئة الحالية لا
-- تملك Docker/pgtap (نفس القيد الموثَّق في الملفات السابقة)، فلم يُتحقق من
-- نجاح هذا الملف فعلياً هنا، فقط كُتب وفق قواعد pgtap الصحيحة ومطابقاً لمخطط
-- الهجرات الفعلي (auth_branch_ids/has_capability من 0002، auth.uid() عبر
-- request.jwt.claims بنفس أسلوب Supabase).
--
-- السيناريوهات:
-- 1) owner بصلاحية manage_reservations يُدرج preorder item ضمن فرعه (نجاح).
-- 2) نفس المستخدم يرى الصف الذي أنشأه (view_reservations ضمن نطاقه).
-- 3) محاولة إدراج بـ branch_id يتبع مطعماً آخر تُرفض (RLS).
-- 4) owner لمطعم آخر لا يرى صفوف الفرع الأول إطلاقاً.
-- 5) owner الأول يحذف الصف ضمن فرعه (نجاح).
-- 6) الصف فعلاً غير موجود بعد الحذف.

begin;

select plan(6);

-- Fixtures (تُنفَّذ بدور الاتصال الافتراضي — عادة postgres/supabase_admin،
-- يتجاوز RLS بصفته مالك الجداول).
insert into public.restaurants (id, name_ar, name_en) values
  ('11111111-1111-1111-1111-111111111111', 'مطعم أ', 'Restaurant A'),
  ('22222222-2222-2222-2222-222222222222', 'مطعم ب', 'Restaurant B');

insert into public.branches (id, restaurant_id, name_ar, name_en) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'فرع أ1', 'Branch A1'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'فرع ب1', 'Branch B1');

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', 'u1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'owner-a@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'u2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'owner-b@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '');

-- صفوف profiles تُنشأ تلقائياً عبر trigger handle_new_user عند إدراج auth.users.
update public.profiles set restaurant_id = '11111111-1111-1111-1111-111111111111', role_id = (select id from public.roles where key = 'owner')
  where id = 'u1111111-1111-1111-1111-111111111111';

update public.profiles set restaurant_id = '22222222-2222-2222-2222-222222222222', role_id = (select id from public.roles where key = 'owner')
  where id = 'u2222222-2222-2222-2222-222222222222';

insert into public.customers (id, branch_id, name, phone) values
  ('c1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'عميل تجريبي', '0500000001');

insert into public.reservations (id, branch_id, customer_id, party_size, reservation_time) values
  ('r1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 2, now());

insert into public.menu_items (id, branch_id, name_ar, name_en, price) values
  ('m1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'صنف تجريبي', 'Test Item', 10);

-- جلسة owner-a (فرع/مطعم A).
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'u1111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ insert into public.reservation_preorder_items (branch_id, reservation_id, menu_item_id, quantity)
     values ('a1111111-1111-1111-1111-111111111111', 'r1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 2) $$,
  'owner-a يمكنه إدراج preorder item ضمن فرعه'
);

select isnt_empty(
  $$ select 1 from public.reservation_preorder_items where reservation_id = 'r1111111-1111-1111-1111-111111111111' $$,
  'owner-a يرى preorder item الذي أنشأه'
);

select throws_ok(
  $$ insert into public.reservation_preorder_items (branch_id, reservation_id, menu_item_id, quantity)
     values ('b2222222-2222-2222-2222-222222222222', 'r1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 1) $$,
  '42501',
  null,
  'رفض إدراج preorder item بـ branch_id خارج نطاق owner-a'
);

-- جلسة owner-b (مطعم آخر تماماً).
select set_config('request.jwt.claims', json_build_object('sub', 'u2222222-2222-2222-2222-222222222222', 'role', 'authenticated')::text, true);

select is_empty(
  $$ select 1 from public.reservation_preorder_items where reservation_id = 'r1111111-1111-1111-1111-111111111111' $$,
  'owner-b لا يرى preorder items لفرع مطعم آخر'
);

-- رجوع لجلسة owner-a للحذف.
select set_config('request.jwt.claims', json_build_object('sub', 'u1111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

select lives_ok(
  $$ delete from public.reservation_preorder_items where reservation_id = 'r1111111-1111-1111-1111-111111111111' $$,
  'owner-a يمكنه حذف preorder item ضمن فرعه'
);

select is_empty(
  $$ select 1 from public.reservation_preorder_items where reservation_id = 'r1111111-1111-1111-1111-111111111111' $$,
  'preorder item حُذف فعلياً'
);

select * from finish();

rollback;
