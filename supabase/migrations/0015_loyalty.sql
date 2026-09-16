-- المرحلة 14: نظام الولاء (نطاق أولي فقط). العضوية والرصيد على مستوى
-- المطعم (restaurant_id) لا الفرع — نفس العميل يجمع نقاطاً من أي فرع تابع
-- لنفس المطعم، لذا استثناء متعمّد عن قاعدة "كل جدول جديد يحمل branch_id
-- مباشرة" لجدول loyalty_members/loyalty_settings/loyalty_tiers/loyalty_rewards
-- تحديداً (موثَّق في tasks/todo.md). كل تعديل على points_balance يمر حصراً
-- عبر RPC أمنية أدناه — بلا سياسة UPDATE مباشرة من العميل على الرصيد مهما كانت.

create table public.loyalty_settings (
  restaurant_id uuid primary key references public.restaurants(id) on delete cascade,
  points_per_currency_unit numeric(10, 4) not null default 1 check (points_per_currency_unit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.loyalty_tiers (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  min_points integer not null default 0 check (min_points >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index loyalty_tiers_restaurant_id_idx on public.loyalty_tiers (restaurant_id);

create table public.loyalty_rewards (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  points_cost integer not null check (points_cost > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index loyalty_rewards_restaurant_id_idx on public.loyalty_rewards (restaurant_id);

-- phone بصيغة auth.users.phone (E.164 بلا +، كما يخزّنها Supabase Phone Auth).
create table public.loyalty_members (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  phone text not null,
  auth_user_id uuid unique references auth.users(id) on delete set null,
  points_balance integer not null default 0 check (points_balance >= 0),
  created_at timestamptz not null default now(),
  unique (restaurant_id, phone)
);

create index loyalty_members_restaurant_id_idx on public.loyalty_members (restaurant_id);

create table public.loyalty_receipt_submissions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  member_id uuid not null references public.loyalty_members(id) on delete cascade,
  receipt_image_path text not null,
  extracted_amount numeric(10, 2),
  points_awarded integer not null default 0,
  status text not null default 'pending_ocr' check (status in ('pending_ocr', 'approved', 'rejected')),
  ocr_note text,
  created_at timestamptz not null default now()
);

create index loyalty_receipt_submissions_branch_id_idx on public.loyalty_receipt_submissions (branch_id);
create index loyalty_receipt_submissions_member_id_idx on public.loyalty_receipt_submissions (member_id);

create table public.loyalty_redemptions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  member_id uuid not null references public.loyalty_members(id) on delete cascade,
  reward_id uuid not null references public.loyalty_rewards(id) on delete cascade,
  points_spent integer not null check (points_spent > 0),
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

create index loyalty_redemptions_restaurant_id_idx on public.loyalty_redemptions (restaurant_id);
create index loyalty_redemptions_member_id_idx on public.loyalty_redemptions (member_id);

-- صلاحية إدارية جديدة لـowner/branch_manager فقط (نفس نمط manage_event_reservations).
insert into public.role_capabilities (role_id, capability_key)
select id, 'manage_loyalty'
from public.roles
where key in ('owner', 'branch_manager');

-- bucket خاص (غير عام) لصور الفواتير، بخلاف menu-images العام من المرحلة 4 —
-- القراءة/الكتابة عبر عميل admin فقط من Server Actions.
insert into storage.buckets (id, name, public)
values ('loyalty-receipts', 'loyalty-receipts', false)
on conflict (id) do nothing;

-- تُعيد restaurant_id للمستخدم الموظف الحالي عبر فروعه المتاحة (auth_branch_ids())
-- بدل الاعتماد على profiles.restaurant_id مباشرة (قد تكون فارغة لـbranch_manager
-- الذي نطاقه branch فقط) — لازمة لجداول الولاء المطعمية بلا branch_id.
create function public.auth_restaurant_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select restaurant_id from public.branches where id = any(public.auth_branch_ids()) limit 1;
$$;

alter table public.loyalty_settings enable row level security;
alter table public.loyalty_tiers enable row level security;
alter table public.loyalty_rewards enable row level security;
alter table public.loyalty_members enable row level security;
alter table public.loyalty_receipt_submissions enable row level security;
alter table public.loyalty_redemptions enable row level security;

-- loyalty_settings: بيانات غير حساسة (معدّل تحويل نقاط فقط) — قراءة عامة،
-- كتابة لصاحب manage_loyalty ضمن مطعمه فقط.
create policy loyalty_settings_select on public.loyalty_settings
  for select to anon, authenticated using (true);

create policy loyalty_settings_insert on public.loyalty_settings
  for insert to authenticated
  with check (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

create policy loyalty_settings_update on public.loyalty_settings
  for update to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'))
  with check (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

-- loyalty_tiers: عرض عام (تسويقي)، إدارة لصاحب manage_loyalty.
create policy loyalty_tiers_select on public.loyalty_tiers
  for select to anon, authenticated using (true);

create policy loyalty_tiers_insert on public.loyalty_tiers
  for insert to authenticated
  with check (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

create policy loyalty_tiers_update on public.loyalty_tiers
  for update to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'))
  with check (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

create policy loyalty_tiers_delete on public.loyalty_tiers
  for delete to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

-- loyalty_rewards: anon يرى النشط فقط (تسويقي قبل تسجيل الدخول)، الموظف يرى الكل.
create policy loyalty_rewards_select on public.loyalty_rewards
  for select to authenticated using (true);

create policy loyalty_rewards_select_public on public.loyalty_rewards
  for select to anon using (is_active = true);

create policy loyalty_rewards_insert on public.loyalty_rewards
  for insert to authenticated
  with check (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

create policy loyalty_rewards_update on public.loyalty_rewards
  for update to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'))
  with check (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

create policy loyalty_rewards_delete on public.loyalty_rewards
  for delete to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

-- loyalty_members: العضو يرى صفّه فقط (auth_user_id = auth.uid())، والموظف
-- يرى أعضاء مطعمه. بلا أي سياسة INSERT/UPDATE مباشرة — الإنشاء والربط عبر
-- join_loyalty_member فقط، وتعديل الرصيد عبر submit_loyalty_receipt/
-- redeem_loyalty_reward فقط (كلها security definer أدناه).
create policy loyalty_members_select_own on public.loyalty_members
  for select to authenticated using (auth_user_id = auth.uid());

create policy loyalty_members_select_staff on public.loyalty_members
  for select to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

-- loyalty_receipt_submissions: العضو يرى سجلّه، الموظف يرى فرعه. بلا سياسة
-- INSERT مباشرة — الإدراج عبر submit_loyalty_receipt فقط.
create policy loyalty_receipt_submissions_select_own on public.loyalty_receipt_submissions
  for select to authenticated
  using (member_id in (select id from public.loyalty_members where auth_user_id = auth.uid()));

create policy loyalty_receipt_submissions_select_staff on public.loyalty_receipt_submissions
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_loyalty'));

-- loyalty_redemptions: نفس نمط القراءة أعلاه، مع سياسة update للموظف لتعليم
-- التسليم فقط (بلا سياسة INSERT مباشرة — الإدراج عبر redeem_loyalty_reward فقط).
create policy loyalty_redemptions_select_own on public.loyalty_redemptions
  for select to authenticated
  using (member_id in (select id from public.loyalty_members where auth_user_id = auth.uid()));

create policy loyalty_redemptions_select_staff on public.loyalty_redemptions
  for select to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

create policy loyalty_redemptions_update_staff on public.loyalty_redemptions
  for update to authenticated
  using (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'))
  with check (restaurant_id = public.auth_restaurant_id() and public.has_capability('manage_loyalty'));

-- RPC 1: ربط/إنشاء عضوية بهاتف جلسة Supabase Phone Auth الحالية لمطعم معيّن.
create function public.join_loyalty_member(p_restaurant_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text;
  v_member_id uuid;
  v_current_auth_user_id uuid;
begin
  select phone into v_phone from auth.users where id = auth.uid();

  if v_phone is null or v_phone = '' then
    raise exception 'لا يوجد رقم هاتف مؤكَّد لهذه الجلسة';
  end if;

  select id, auth_user_id into v_member_id, v_current_auth_user_id
  from public.loyalty_members
  where restaurant_id = p_restaurant_id and phone = v_phone;

  if v_member_id is null then
    insert into public.loyalty_members (restaurant_id, phone, auth_user_id)
    values (p_restaurant_id, v_phone, auth.uid())
    returning id into v_member_id;
  elsif v_current_auth_user_id is distinct from auth.uid() then
    update public.loyalty_members set auth_user_id = auth.uid() where id = v_member_id;
  end if;

  return v_member_id;
end;
$$;

revoke all on function public.join_loyalty_member(uuid) from public;
grant execute on function public.join_loyalty_member(uuid) to authenticated;

-- RPC 2: تسجيل نتيجة رفع فاتورة (نجاح أو فشل استخراج المبلغ عبر OCR في
-- الـServer Action)، ومنح النقاط ذرّياً عند النجاح فقط. p_extracted_amount
-- بقيمة null تعني فشل الاستخراج (سطر مرفوض بلا نقاط، بلا مساس بالرصيد).
create function public.submit_loyalty_receipt(
  p_member_id uuid,
  p_branch_id uuid,
  p_receipt_image_path text,
  p_extracted_amount numeric,
  p_ocr_note text
)
returns table (submission_id uuid, points_awarded integer, status text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_restaurant_id uuid;
  v_branch_restaurant_id uuid;
  v_rate numeric;
  v_points integer;
  v_status text;
  v_submission_id uuid;
begin
  select restaurant_id into v_member_restaurant_id
  from public.loyalty_members
  where id = p_member_id and auth_user_id = auth.uid();

  if v_member_restaurant_id is null then
    raise exception 'عضوية غير صالحة لهذه الجلسة';
  end if;

  select restaurant_id into v_branch_restaurant_id from public.branches where id = p_branch_id;

  if v_branch_restaurant_id is null or v_branch_restaurant_id <> v_member_restaurant_id then
    raise exception 'الفرع لا يتبع مطعم هذه العضوية';
  end if;

  if p_extracted_amount is null then
    v_status := 'rejected';
    v_points := 0;
  else
    v_status := 'approved';
    select points_per_currency_unit into v_rate
    from public.loyalty_settings where restaurant_id = v_member_restaurant_id;
    v_points := floor(p_extracted_amount * coalesce(v_rate, 1))::integer;
  end if;

  insert into public.loyalty_receipt_submissions
    (restaurant_id, branch_id, member_id, receipt_image_path, extracted_amount, points_awarded, status, ocr_note)
  values
    (v_member_restaurant_id, p_branch_id, p_member_id, p_receipt_image_path, p_extracted_amount, v_points, v_status, p_ocr_note)
  returning id into v_submission_id;

  if v_status = 'approved' and v_points > 0 then
    update public.loyalty_members
    set points_balance = points_balance + v_points
    where id = p_member_id;
  end if;

  return query select v_submission_id, v_points, v_status;
end;
$$;

revoke all on function public.submit_loyalty_receipt(uuid, uuid, text, numeric, text) from public;
grant execute on function public.submit_loyalty_receipt(uuid, uuid, text, numeric, text) to authenticated;

-- RPC 3: استبدال مكافأة بالنقاط — خصم ذرّي بشرط توفر رصيد كافٍ (فحص وخصم
-- في نفس أمر UPDATE لمنع أي سباق تزامن، نفس مبدأ redeem_loyalty_reward).
create function public.redeem_loyalty_reward(p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_id uuid;
  v_member_restaurant_id uuid;
  v_reward_restaurant_id uuid;
  v_points_cost integer;
  v_is_active boolean;
  v_updated_member_id uuid;
  v_redemption_id uuid;
begin
  select id, restaurant_id into v_member_id, v_member_restaurant_id
  from public.loyalty_members
  where auth_user_id = auth.uid();

  if v_member_id is null then
    raise exception 'لا عضوية ولاء مرتبطة بهذه الجلسة';
  end if;

  select restaurant_id, points_cost, is_active into v_reward_restaurant_id, v_points_cost, v_is_active
  from public.loyalty_rewards where id = p_reward_id;

  if v_reward_restaurant_id is null or v_reward_restaurant_id <> v_member_restaurant_id or not v_is_active then
    raise exception 'المكافأة غير متاحة لهذا المطعم';
  end if;

  update public.loyalty_members
  set points_balance = points_balance - v_points_cost
  where id = v_member_id and points_balance >= v_points_cost
  returning id into v_updated_member_id;

  if v_updated_member_id is null then
    raise exception 'الرصيد غير كافٍ لاستبدال هذه المكافأة';
  end if;

  insert into public.loyalty_redemptions (restaurant_id, member_id, reward_id, points_spent)
  values (v_member_restaurant_id, v_member_id, p_reward_id, v_points_cost)
  returning id into v_redemption_id;

  return v_redemption_id;
end;
$$;

revoke all on function public.redeem_loyalty_reward(uuid) from public;
grant execute on function public.redeem_loyalty_reward(uuid) to authenticated;
