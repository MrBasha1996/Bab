-- المرحلة 16: موقع تسويقي عام (/site) — معلومات المطعم/الفروع، استفسارات/شكاوى،
-- حجز طاولة ذاتي للأفراد، حجز شركات/مناسبات ذاتي.

alter table public.restaurants add column about_ar text;
alter table public.restaurants add column about_en text;
alter table public.branches add column phone text;

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  phone text not null,
  email text,
  subject text,
  message text not null,
  status text not null default 'new' check (status in ('new', 'read', 'resolved')),
  created_at timestamptz not null default now()
);

create index inquiries_branch_id_idx on public.inquiries (branch_id);

alter table public.inquiries enable row level security;

-- استمارة عامة بلا مصادقة — بلا RETURNING في الخادم (Server Action لا تستدعي
-- .select() بعد insert)، فلا حاجة لسياسة select لـanon إطلاقاً.
create policy inquiries_insert_public on public.inquiries
  for insert to anon with check (true);

create policy inquiries_select on public.inquiries
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('view_inquiries'));

create policy inquiries_update on public.inquiries
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_inquiries'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_inquiries'));

-- صلاحيات جديدة لـowner/branch_manager فقط (قرارات إدارية)، بنفس نمط
-- view_event_reservations/manage_event_reservations في 0009.
insert into public.role_capabilities (role_id, capability_key)
select id, capability_key
from public.roles, unnest(array['view_inquiries', 'manage_inquiries']) as capability_key
where key in ('owner', 'branch_manager');

-- حجز مناسبة/شركة ذاتي: إدراج مستقل بلا حاجة لـRETURNING (الخادم لا يستدعي
-- .select() بعد insert)، لذا سياسة anon insert مباشرة تكفي. القيد
-- status='pending' يمنع أي طلب عام من دخول القاعدة بحالة مؤكَّدة مباشرة —
-- الموظف يراجعها من /event-reservations كالمعتاد.
create policy event_reservations_insert_public on public.event_reservations
  for insert to anon with check (status = 'pending');

-- حجز طاولة فردي ذاتي: يحتاج إدراجين مترابطين (customers ثم reservations) مع
-- الحصول على customer_id الناتج — سياسة anon insert مباشرة تحتاج RETURNING،
-- وهذا يفرض سياسة select لـanon على customers (بيانات عميل حساسة)، وهو
-- بالضبط ما رفضته 0008 صراحة لجدول customers. الحل: RPC واحد security
-- definer يؤدي الإدراجين معاً ويُرجع فقط نجاح/فشل، بنفس نمط
-- get_table_reservation/toggle_item_availability.
create function public.create_public_reservation(
  p_branch_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_party_size integer,
  p_reservation_time timestamptz,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
begin
  if not exists (select 1 from public.branches where id = p_branch_id and deleted_at is null) then
    raise exception 'الفرع غير موجود';
  end if;

  insert into public.customers (branch_id, name, phone)
  values (p_branch_id, p_customer_name, p_customer_phone)
  returning id into v_customer_id;

  insert into public.reservations (branch_id, customer_id, party_size, reservation_time, notes, source, status)
  values (p_branch_id, v_customer_id, p_party_size, p_reservation_time, p_notes, 'website', 'pending');
end;
$$;

grant execute on function public.create_public_reservation(uuid, text, text, integer, timestamptz, text) to anon;
