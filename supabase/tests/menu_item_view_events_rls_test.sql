-- اختبار RLS حقيقي (pgTAP) لجدول menu_item_view_events (هجرة 0014).
-- نفس قيود التشغيل الموضَّحة في reservation_preorder_items_rls_test.sql —
-- يحتاج بيئة pgtap فعلية لم تكن متاحة هنا؛ الملف مكتوب وفق قواعد pgtap
-- الصحيحة ومطابق لمخطط الهجرة الفعلي (سياسة anon insert مفتوحة، select
-- authenticated مقيَّد بـauth_branch_ids()).
--
-- السيناريوهات:
-- 1) anon يُدرج حدث مشاهدة (نجاح — نفس نمط qr_scan_events، مقصود).
-- 2) anon لا يملك أي سياسة select — لا يرى الحدث الذي أدرجه للتو.
-- 3) موظف بنفس الفرع يرى الحدث.
-- 4) موظف بفرع مطعم آخر لا يرى الحدث.

begin;

select plan(4);

insert into public.restaurants (id, name_ar, name_en) values
  ('11111111-1111-1111-1111-111111111111', 'مطعم أ', 'Restaurant A'),
  ('22222222-2222-2222-2222-222222222222', 'مطعم ب', 'Restaurant B');

insert into public.branches (id, restaurant_id, name_ar, name_en) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'فرع أ1', 'Branch A1'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'فرع ب1', 'Branch B1');

insert into public.menu_items (id, branch_id, name_ar, name_en, price) values
  ('m1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'صنف تجريبي', 'Test Item', 10);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', 'u1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'owner-a@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'u2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'owner-b@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '');

update public.profiles set restaurant_id = '11111111-1111-1111-1111-111111111111', role_id = (select id from public.roles where key = 'owner')
  where id = 'u1111111-1111-1111-1111-111111111111';

update public.profiles set restaurant_id = '22222222-2222-2222-2222-222222222222', role_id = (select id from public.roles where key = 'owner')
  where id = 'u2222222-2222-2222-2222-222222222222';

-- جلسة anon (بلا jwt).
set local role anon;

select lives_ok(
  $$ insert into public.menu_item_view_events (branch_id, menu_item_id, source)
     values ('a1111111-1111-1111-1111-111111111111', 'm1111111-1111-1111-1111-111111111111', 'qr') $$,
  'anon يمكنه إدراج حدث مشاهدة صنف'
);

select is_empty(
  $$ select 1 from public.menu_item_view_events where menu_item_id = 'm1111111-1111-1111-1111-111111111111' $$,
  'anon لا يملك سياسة select — لا يرى ما أدرجه'
);

-- جلسة owner-a (نفس فرع الصنف).
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'u1111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

select isnt_empty(
  $$ select 1 from public.menu_item_view_events where menu_item_id = 'm1111111-1111-1111-1111-111111111111' $$,
  'owner-a (نفس الفرع) يرى حدث المشاهدة'
);

-- جلسة owner-b (فرع مطعم آخر).
select set_config('request.jwt.claims', json_build_object('sub', 'u2222222-2222-2222-2222-222222222222', 'role', 'authenticated')::text, true);

select is_empty(
  $$ select 1 from public.menu_item_view_events where menu_item_id = 'm1111111-1111-1111-1111-111111111111' $$,
  'owner-b (فرع مطعم آخر) لا يرى حدث المشاهدة'
);

select * from finish();

rollback;
