-- اختبار RLS حقيقي (pgTAP) لجداول الولاء loyalty_* (هجرة 0015 + تعديلات
-- 0019/0022). نفس قيود التشغيل الموضَّحة في الملفين السابقين — لم يُتحقق من
-- نجاح هذا الملف فعلياً في هذه البيئة (لا Docker/pgtap)، لكنه مكتوب وفق مخطط
-- الهجرات الفعلي ودوال auth_branch_ids()/auth_restaurant_id()/has_capability()
-- وتوقيعات RPC الحالية (join_loyalty_member(uuid,text)، submit_loyalty_receipt
-- بستة معاملات، redeem_loyalty_reward(uuid)).
--
-- السيناريوهات:
-- 1) anon يرى loyalty_settings (بيانات عامة غير حساسة).
-- 2) anon يرى loyalty_tiers.
-- 3) anon يرى فقط المكافآت النشطة (is_active = true)، لا الخاملة.
-- 4) عضو ولاء (member-a) يرى صفّه فقط في loyalty_members (auth_user_id = uid).
-- 5) عضو ولاء آخر لا يرى صف عضو غير صفّه.
-- 6) موظف (owner) يرى كل أعضاء مطعمه عبر loyalty_members_select_staff.
-- 7) موظف مطعم آخر لا يرى أعضاء هذا المطعم.
-- 8) join_loyalty_member(restaurant_id, phone) ينشئ عضوية جديدة مربوطة بجلسة
--    Google-auth الحالية (auth.uid()).
-- 9) submit_loyalty_receipt يمنح نقاطاً ذرّياً عند نجاح الاستخراج ويحدّث الرصيد.
-- 10) redeem_loyalty_reward يرفض الاستبدال إن كان الرصيد أقل من كلفة المكافأة.

begin;

select plan(10);

insert into public.restaurants (id, name_ar, name_en) values
  ('11111111-1111-1111-1111-111111111111', 'مطعم أ', 'Restaurant A'),
  ('22222222-2222-2222-2222-222222222222', 'مطعم ب', 'Restaurant B');

insert into public.branches (id, restaurant_id, name_ar, name_en) values
  ('a1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'فرع أ1', 'Branch A1'),
  ('b2222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', 'فرع ب1', 'Branch B1');

insert into public.loyalty_settings (restaurant_id, points_per_currency_unit) values
  ('11111111-1111-1111-1111-111111111111', 1);

insert into public.loyalty_tiers (id, restaurant_id, name_ar, name_en, min_points) values
  ('t1111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'فضي', 'Silver', 0);

insert into public.loyalty_rewards (id, restaurant_id, name_ar, name_en, points_cost, is_active) values
  ('rw111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', 'مكافأة نشطة', 'Active Reward', 10, true),
  ('rw222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'مكافأة خاملة', 'Inactive Reward', 10, false);

-- مستخدمو Google-auth (أعضاء ولاء) + موظفو المطعمين.
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, confirmation_token, recovery_token)
values
  ('00000000-0000-0000-0000-000000000000', 'ma111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'member-a@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'mb222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'member-b@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'mc333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'member-c-new@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"google","providers":["google"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'u1111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'owner-a@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', ''),
  ('00000000-0000-0000-0000-000000000000', 'u2222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'owner-b@test.local', crypt('password', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', false, '', '');

update public.profiles set restaurant_id = '11111111-1111-1111-1111-111111111111', role_id = (select id from public.roles where key = 'owner')
  where id = 'u1111111-1111-1111-1111-111111111111';

update public.profiles set restaurant_id = '22222222-2222-2222-2222-222222222222', role_id = (select id from public.roles where key = 'owner')
  where id = 'u2222222-2222-2222-2222-222222222222';

-- عضويتان جاهزتان لمطعم A (member-a) ولمطعم B (member-b) لاختبار العزل.
insert into public.loyalty_members (id, restaurant_id, phone, auth_user_id, points_balance) values
  ('lm111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '0500000001', 'ma111111-1111-1111-1111-111111111111', 5),
  ('lm222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '0500000002', 'mb222222-2222-2222-2222-222222222222', 0);

-- 1) anon يرى loyalty_settings.
set local role anon;

select isnt_empty(
  $$ select 1 from public.loyalty_settings where restaurant_id = '11111111-1111-1111-1111-111111111111' $$,
  'anon يرى loyalty_settings (عام)'
);

-- 2) anon يرى loyalty_tiers.
select isnt_empty(
  $$ select 1 from public.loyalty_tiers where restaurant_id = '11111111-1111-1111-1111-111111111111' $$,
  'anon يرى loyalty_tiers (عام)'
);

-- 3) anon يرى المكافأة النشطة فقط، لا الخاملة.
select results_eq(
  $$ select id from public.loyalty_rewards where restaurant_id = '11111111-1111-1111-1111-111111111111' order by id $$,
  $$ values ('rw111111-1111-1111-1111-111111111111'::uuid) $$,
  'anon يرى فقط المكافآت النشطة'
);

-- 4) member-a يرى صفّه فقط.
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'ma111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

select isnt_empty(
  $$ select 1 from public.loyalty_members where id = 'lm111111-1111-1111-1111-111111111111' $$,
  'member-a يرى صفّه في loyalty_members'
);

-- 5) member-a لا يرى صف member-b.
select is_empty(
  $$ select 1 from public.loyalty_members where id = 'lm222222-2222-2222-2222-222222222222' $$,
  'member-a لا يرى صف عضو آخر'
);

-- 6) owner-a (staff, manage_loyalty) يرى كل أعضاء مطعمه.
select set_config('request.jwt.claims', json_build_object('sub', 'u1111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

select isnt_empty(
  $$ select 1 from public.loyalty_members where id = 'lm111111-1111-1111-1111-111111111111' $$,
  'owner-a (موظف مطعمه) يرى عضو loyalty_members'
);

-- 7) owner-b لا يرى أعضاء مطعم آخر.
select set_config('request.jwt.claims', json_build_object('sub', 'u2222222-2222-2222-2222-222222222222', 'role', 'authenticated')::text, true);

select is_empty(
  $$ select 1 from public.loyalty_members where id = 'lm111111-1111-1111-1111-111111111111' $$,
  'owner-b (موظف مطعم آخر) لا يرى عضو مطعم A'
);

-- 8) join_loyalty_member ينشئ عضوية جديدة مربوطة بجلسة member-c الجديدة.
select set_config('request.jwt.claims', json_build_object('sub', 'mc333333-3333-3333-3333-333333333333', 'role', 'authenticated')::text, true);

select isnt_empty(
  $$ select public.join_loyalty_member('11111111-1111-1111-1111-111111111111'::uuid, '0500000099') $$,
  'join_loyalty_member ينشئ عضوية جديدة ويعيد id'
);

select isnt_empty(
  $$ select 1 from public.loyalty_members where restaurant_id = '11111111-1111-1111-1111-111111111111' and auth_user_id = 'mc333333-3333-3333-3333-333333333333' $$,
  'العضوية الجديدة مربوطة فعلياً بجلسة member-c'
);

-- 9) submit_loyalty_receipt يمنح نقاطاً ذرّياً ويحدّث points_balance (member-a، رصيد ابتدائي 5).
select set_config('request.jwt.claims', json_build_object('sub', 'ma111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

select public.submit_loyalty_receipt(
  'lm111111-1111-1111-1111-111111111111'::uuid,
  'a1111111-1111-1111-1111-111111111111'::uuid,
  'a1111111-1111-1111-1111-111111111111/lm111111-1111-1111-1111-111111111111/receipt.jpg',
  100::numeric,
  'INV-TEST-0001',
  null
);

select results_eq(
  $$ select points_balance from public.loyalty_members where id = 'lm111111-1111-1111-1111-111111111111' $$,
  $$ values (105) $$,
  'submit_loyalty_receipt أضاف 100 نقطة (معدل 1) لرصيد member-a (5 -> 105)'
);

-- 10) redeem_loyalty_reward يرفض استبدال مكافأة كلفتها 10 نقاط لعضو رصيده الآن
-- 105 لكن بعد خصمها يجب ألا يقبل استبدالاً ثانياً يتجاوز الرصيد المتبقي.
-- نستنزف الرصيد أولاً عبر تحديث مباشر (بدور غير مقيَّد) لمحاكاة رصيد صفر.
reset role;
update public.loyalty_members set points_balance = 0 where id = 'lm111111-1111-1111-1111-111111111111';
set local role authenticated;
select set_config('request.jwt.claims', json_build_object('sub', 'ma111111-1111-1111-1111-111111111111', 'role', 'authenticated')::text, true);

select throws_ok(
  $$ select public.redeem_loyalty_reward('rw111111-1111-1111-1111-111111111111'::uuid) $$,
  'P0001',
  'الرصيد غير كافٍ لاستبدال هذه المكافأة',
  'redeem_loyalty_reward يرفض الاستبدال عند رصيد غير كافٍ'
);

select * from finish();

rollback;
