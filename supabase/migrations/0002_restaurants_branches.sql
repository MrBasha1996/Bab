-- المرحلة 2: المطاعم والفروع + دالة نطاق الصلاحيات auth_branch_ids() (مؤجَّلة
-- من هجرة 0001 لأنها تحتاج جدول branches). كل جدول لاحق يحمل branch_id مباشرة
-- (denormalized) لتبسيط RLS، كما في خطة التنفيذ المعتمدة.

create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null references public.restaurants(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  address_ar text,
  address_en text,
  timezone text not null default 'Asia/Riyadh',
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create index branches_restaurant_id_idx on public.branches (restaurant_id);

alter table public.profiles
  add constraint profiles_restaurant_id_fkey foreign key (restaurant_id) references public.restaurants(id),
  add constraint profiles_branch_id_fkey foreign key (branch_id) references public.branches(id);

-- تُعيد كل الفروع التي يصل إليها المستخدم الحالي: كل فروع مطعمه إن كان دوره
-- بنطاق restaurant (owner)، أو فرعه فقط إن كان نطاق branch، وإلا مصفوفة فارغة.
create function public.auth_branch_ids()
returns uuid[]
language sql
security definer
stable
set search_path = public
as $$
  select case
    when r.scope_type = 'restaurant' then
      coalesce(array(select id from public.branches where restaurant_id = p.restaurant_id and deleted_at is null), array[]::uuid[])
    when r.scope_type = 'branch' and p.branch_id is not null then
      array[p.branch_id]
    else array[]::uuid[]
  end
  from public.profiles p
  left join public.roles r on r.id = p.role_id
  where p.id = auth.uid();
$$;

-- يفحص أن المستخدم الحالي يملك القدرة (capability) المحددة عبر دوره.
create function public.has_capability(capability text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    join public.role_capabilities rc on rc.role_id = p.role_id
    where p.id = auth.uid() and rc.capability_key = capability
  );
$$;

alter table public.restaurants enable row level security;
alter table public.branches enable row level security;

create policy restaurants_select on public.restaurants
  for select to authenticated
  using (id = (select restaurant_id from public.profiles where id = auth.uid()));

create policy restaurants_update on public.restaurants
  for update to authenticated
  using (id = (select restaurant_id from public.profiles where id = auth.uid()) and public.has_capability('manage_restaurant_settings'))
  with check (id = (select restaurant_id from public.profiles where id = auth.uid()) and public.has_capability('manage_restaurant_settings'));

-- auth_branch_ids() يُرجع فعلاً كل فروع المطعم لدور بنطاق restaurant (owner)
-- وفرعاً واحداً فقط لدور بنطاق branch — لا حاجة لفرع OR إضافي هنا، وإضافته
-- كانت ستكشف فروعاً شقيقة لموظف فرع واحد (ثغرة عزل).
create policy branches_select on public.branches
  for select to authenticated
  using (id = any(public.auth_branch_ids()));

create policy branches_insert on public.branches
  for insert to authenticated
  with check (restaurant_id = (select restaurant_id from public.profiles where id = auth.uid()) and public.has_capability('manage_branches'));

create policy branches_update on public.branches
  for update to authenticated
  using (id = any(public.auth_branch_ids()) and public.has_capability('manage_branches'))
  with check (restaurant_id = (select restaurant_id from public.profiles where id = auth.uid()) and public.has_capability('manage_branches'));
