-- المرحلة 13: أساسات تحليلات المنيو الرقمي (بنية تحتية فقط، بلا لوحة عرض الآن).
-- توسيع نقاط تسجيل الأحداث فيما وراء فتح QR (qr_scan_events من 0008) إلى فتح
-- تفاصيل صنف بعينه، تحضيراً للوحة تحليلات لاحقة (الأكثر مشاهدة، ذروة الأوقات)
-- — لا لوحة/تقرير يُبنى في هذه الهجرة، تسجيل الأحداث فقط.

create table public.menu_item_view_events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  table_id uuid references public.tables(id) on delete cascade,
  source text not null check (source in ('qr', 'tablet')),
  created_at timestamptz not null default now()
);

create index menu_item_view_events_branch_id_idx on public.menu_item_view_events (branch_id);
create index menu_item_view_events_menu_item_id_idx on public.menu_item_view_events (menu_item_id);

alter table public.menu_item_view_events enable row level security;

-- نفس نمط qr_scan_events في 0008: كتابة anon فقط، بلا قراءة لـ anon.
create policy menu_item_view_events_insert_public on public.menu_item_view_events
  for insert to anon with check (true);

create policy menu_item_view_events_select on public.menu_item_view_events
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()));
