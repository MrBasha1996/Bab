-- المرحلة 17: صفحة اختيار (Gateway) قبل المنيو — منيو / شكوى واقتراح ضيف
-- طاولة (مختلفة عن inquiries العامة في 0016، وهي استفسار من موقع تسويقي
-- عام بلا طاولة) / تقييم Google Maps للفرع.

alter table public.branches add column google_reviews_url text;

create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  type text not null check (type in ('complaint', 'suggestion')),
  message text not null,
  customer_name text,
  customer_phone text,
  created_at timestamptz not null default now()
);

create index complaints_branch_id_idx on public.complaints (branch_id);

alter table public.complaints enable row level security;

-- نفس نمط qr_scan_events_insert_public في 0008: كتابة anon فقط بلا RETURNING
-- (الخادم لا يستدعي .select() بعد insert)، فلا حاجة لسياسة select لـanon.
create policy complaints_insert_public on public.complaints
  for insert to anon with check (true);

create policy complaints_select on public.complaints
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('view_complaints'));

-- صلاحية جديدة لـowner/branch_manager فقط (قرارات إدارية)، بنفس نمط
-- view_event_reservations في 0009 وview_inquiries في 0016.
insert into public.role_capabilities (role_id, capability_key)
select id, capability_key
from public.roles, unnest(array['view_complaints']) as capability_key
where key in ('owner', 'branch_manager');
