-- المرحلة 1: الأدوار (roles + capabilities) والبروفايلات.
-- ملاحظة تسلسل: دالة auth_branch_ids() تُنشأ في هجرة 0002 بعد وجود جدول
-- branches (لا معنى لها قبل ذلك) — لا RLS مبنية على نطاق فرع هنا بعد.

create extension if not exists pgcrypto;

create table public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  scope_type text not null check (scope_type in ('none', 'restaurant', 'branch')),
  is_system boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.role_capabilities (
  role_id uuid not null references public.roles(id) on delete cascade,
  capability_key text not null,
  primary key (role_id, capability_key)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  restaurant_id uuid,
  branch_id uuid,
  role_id uuid references public.roles(id),
  locale text not null default 'ar' check (locale in ('ar', 'en')),
  full_name text,
  created_at timestamptz not null default now()
);

-- الأدوار النظامية الأولية (owner: كل فروع المطعم، branch_manager/staff: فرع واحد).
insert into public.roles (key, scope_type, is_system) values
  ('owner', 'restaurant', true),
  ('branch_manager', 'branch', true),
  ('staff', 'branch', true);

insert into public.role_capabilities (role_id, capability_key)
select id, capability_key
from public.roles, unnest(array[
  'manage_restaurant_settings', 'manage_branches', 'manage_tables', 'manage_qr',
  'manage_menus', 'manage_categories', 'manage_items', 'toggle_item_availability',
  'view_reservations', 'manage_reservations', 'manage_staff'
]) as capability_key
where key = 'owner';

insert into public.role_capabilities (role_id, capability_key)
select id, capability_key
from public.roles, unnest(array[
  'manage_tables', 'manage_qr', 'manage_menus', 'manage_categories', 'manage_items',
  'toggle_item_availability', 'view_reservations', 'manage_reservations'
]) as capability_key
where key = 'branch_manager';

insert into public.role_capabilities (role_id, capability_key)
select id, capability_key
from public.roles, unnest(array['toggle_item_availability', 'view_reservations']) as capability_key
where key = 'staff';

alter table public.roles enable row level security;
alter table public.role_capabilities enable row level security;
alter table public.profiles enable row level security;

-- roles/role_capabilities: قراءة فقط لأي مستخدم موثَّق (لازمة لفحص صلاحياته)،
-- بلا كتابة عبر RLS في هذه المرحلة (تُدار عبر هجرات لاحقة عند الحاجة).
create policy roles_select on public.roles
  for select to authenticated using (true);

create policy role_capabilities_select on public.role_capabilities
  for select to authenticated using (true);

-- profiles: كل مستخدم يرى ويعدّل صفّه فقط. لا وصول عابر لفروع أخرى بعد —
-- سيُضاف في هجرة 0002 مع auth_branch_ids().
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

create policy profiles_update_own on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- إنشاء صف profiles تلقائياً عند تسجيل مستخدم جديد في auth.users.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
