-- المرحلة 3: الطاولات + رموز QR.

-- الرابط العام للمنيو هو /m/[branchSlug]/t/[qrToken] (راجع CLAUDE.md) — عمود
-- slug لم يكن موجوداً في هجرة 0002 لأن لا حاجة له قبل هذه المرحلة. يُشتق تلقائياً
-- من name_en للفروع الموجودة حالياً، ولا يُعدَّل من الواجهة لاحقاً (تجنّب كسر
-- روابط QR مطبوعة فعلياً).
alter table public.branches add column slug text;

update public.branches
set slug = regexp_replace(lower(trim(name_en)), '[^a-z0-9]+', '-', 'g')
where slug is null;

alter table public.branches
  alter column slug set not null,
  add constraint branches_slug_unique unique (slug);

create table public.tables (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  label_ar text not null,
  label_en text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index tables_branch_id_idx on public.tables (branch_id);

-- علاقة 1:1 مع tables عمداً (لا سجل تاريخي متعدد): إعادة التوليد تُحدّث نفس
-- الصف وتستبدل qr_token القديم تماماً، وهذا يكفي لإبطال الرابط القديم فوراً
-- بلا حاجة لتتبع تاريخ الرموز.
create table public.table_qr_codes (
  id uuid primary key default gen_random_uuid(),
  table_id uuid not null unique references public.tables(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  qr_token text not null unique default encode(gen_random_bytes(32), 'hex'),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index table_qr_codes_branch_id_idx on public.table_qr_codes (branch_id);

alter table public.tables enable row level security;
alter table public.table_qr_codes enable row level security;

create policy tables_select on public.tables
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()));

create policy tables_insert on public.tables
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_tables'));

create policy tables_update on public.tables
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_tables'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_tables'));

create policy table_qr_codes_select on public.table_qr_codes
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()));

-- تحضيراً للمنيو العام (المرحلة 6): يحتاج anon حل qr_token إلى طاولة/فرع
-- بلا مصادقة. لا كتابة إطلاقاً لـ anon.
create policy table_qr_codes_select_public on public.table_qr_codes
  for select to anon
  using (is_active = true);

create policy table_qr_codes_insert on public.table_qr_codes
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_qr'));

create policy table_qr_codes_update on public.table_qr_codes
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_qr'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_qr'));
