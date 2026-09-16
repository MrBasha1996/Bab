-- المرحلة 5: الحجز المبسّط (MVP).
-- بدون Pre-order (مؤجَّل عمداً — خارج نطاق MVP). بدون find-or-create للعميل
-- بالهاتف (كل حجز ينشئ صف customers جديد) وبدون عمود status (لا تدفق
-- إلغاء/تأكيد في هذه المرحلة، كل صف يُعتبر حجزاً فعالاً ضمنياً) — تبسيط
-- متعمّد يطابق نطاق "إنشاء/عرض فقط" في tasks/todo.md.

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);

create index customers_branch_id_idx on public.customers (branch_id);

create table public.reservations (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  customer_id uuid not null references public.customers(id) on delete cascade,
  party_size integer not null check (party_size > 0),
  reservation_time timestamptz not null,
  notes text,
  created_at timestamptz not null default now()
);

create index reservations_branch_id_idx on public.reservations (branch_id);
create index reservations_table_id_idx on public.reservations (table_id);

alter table public.customers enable row level security;
alter table public.reservations enable row level security;

-- لا سياسة anon هنا عمداً: صفحة QR (المرحلة 6) ستحتاج قراءة محدودة جداً
-- لحجز الطاولة الحالية، وستُضاف في هجرتها الخاصة بدل تعديل هذه الهجرة بعد تطبيقها.

create policy customers_select on public.customers
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('view_reservations'));

create policy customers_insert on public.customers
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_reservations'));

create policy reservations_select on public.reservations
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('view_reservations'));

create policy reservations_insert on public.reservations
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_reservations'));
