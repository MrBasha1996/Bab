-- المرحلة 9: حجوزات الشركات/المناسبات (Corporate & Events)، منفصلة عن
-- حجز الأفراد MVP (public.reservations) لاختلاف طبيعة البيانات (لا طاولة
-- ثابتة بالضرورة، تدفق موافقة عبر status، تفاصيل جهة/مناسبة).

create table public.event_reservations (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  reservation_type text not null check (reservation_type in ('event', 'corporate')),
  company_name text,
  contact_name text not null,
  contact_phone text not null,
  guest_count integer not null check (guest_count > 0),
  event_date timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  notes text,
  created_at timestamptz not null default now()
);

create index event_reservations_branch_id_idx on public.event_reservations (branch_id);

alter table public.event_reservations enable row level security;

-- صلاحيات جديدة لـowner/branch_manager فقط (قرارات إدارية، ليست لـstaff).
insert into public.role_capabilities (role_id, capability_key)
select id, capability_key
from public.roles, unnest(array['view_event_reservations', 'manage_event_reservations']) as capability_key
where key in ('owner', 'branch_manager');

create policy event_reservations_select on public.event_reservations
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('view_event_reservations'));

create policy event_reservations_insert on public.event_reservations
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_event_reservations'));

create policy event_reservations_update on public.event_reservations
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_event_reservations'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_event_reservations'));
