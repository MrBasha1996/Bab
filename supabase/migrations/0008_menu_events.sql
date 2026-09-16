-- المرحلة 6: واجهة المنيو العامة (QR + Tablet).

-- تسجيل مسح QR (تحليلي بحت، بلا قراءة لـ anon — الكتابة فقط).
create table public.qr_scan_events (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  table_id uuid not null references public.tables(id) on delete cascade,
  qr_code_id uuid not null references public.table_qr_codes(id) on delete cascade,
  scanned_at timestamptz not null default now()
);

create index qr_scan_events_branch_id_idx on public.qr_scan_events (branch_id);
create index qr_scan_events_table_id_idx on public.qr_scan_events (table_id);

alter table public.qr_scan_events enable row level security;

create policy qr_scan_events_insert_public on public.qr_scan_events
  for insert to anon with check (true);

create policy qr_scan_events_select on public.qr_scan_events
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()));

-- صفحة QR العامة تحتاج قراءة anon لاسم/شعار المطعم واسم الفرع واسم الطاولة —
-- بيانات غير حساسة أصلاً (تُقرأ من QR مطبوع فعلياً)، بنفس نمط
-- menu_categories_select_public في 0006.
create policy restaurants_select_public on public.restaurants
  for select to anon using (deleted_at is null);

create policy branches_select_public on public.branches
  for select to anon using (deleted_at is null);

create policy tables_select_public on public.tables
  for select to anon using (deleted_at is null);

-- الحجز: بيانات العميل (اسم/هاتف) حساسة ولا يجوز منحها عبر سياسة anon عامة
-- على جدول reservations مباشرة — أي عميل REST يحمل مفتاح anon العام (مكشوف
-- في متصفح أي زائر) سيقدر عندها على تفريغ حجوزات كل المطاعم على المنصة
-- بجدول .select() مباشر بلا أي فلتر، بصرف النظر عن استعلامات تطبيقنا. الحل:
-- RPC واحد (security definer) يتحقق من qr_token فعلياً قبل إرجاع أي صف،
-- بنفس نمط toggle_item_availability في 0006 — لا سياسة anon على reservations
-- أو customers إطلاقاً.
create function public.get_table_reservation(p_branch_slug text, p_qr_token text)
returns table (
  customer_name text,
  customer_phone text,
  party_size integer,
  reservation_time timestamptz,
  notes text
)
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_table_id uuid;
begin
  select t.id into v_table_id
  from public.table_qr_codes qr
  join public.tables t on t.id = qr.table_id
  join public.branches b on b.id = t.branch_id
  where qr.qr_token = p_qr_token
    and qr.is_active = true
    and b.slug = p_branch_slug
    and t.deleted_at is null;

  if v_table_id is null then
    return;
  end if;

  return query
    select c.name, c.phone, r.party_size, r.reservation_time, r.notes
    from public.reservations r
    join public.customers c on c.id = r.customer_id
    where r.table_id = v_table_id
      and r.reservation_time between now() - interval '1 hour' and now() + interval '6 hours'
    order by r.reservation_time asc
    limit 1;
end;
$$;

grant execute on function public.get_table_reservation(text, text) to anon;
