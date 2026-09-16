-- المرحلة 11: Pre-order أثناء الحجز — اختيار العميل لأصناف من المنيو عند
-- إنشاء الحجز (قبل الوصول)، منفصل عن تصفح Digital Menu وقت الحضور (المرحلة 6).
-- بلا سعر مخزَّن (يُقرأ من menu_items/item_variants وقت العرض، تجنّباً لتضارب
-- مصدر الحقيقة). branch_id مُضاف مباشرة (denormalized) بنفس قاعدة كل جدول جديد
-- في هذا المشروع، بدل الاعتماد على join عبر reservation_id لسياسات RLS.

create table public.reservation_preorder_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  item_variant_id uuid references public.item_variants(id) on delete set null,
  quantity integer not null default 1 check (quantity > 0),
  notes text,
  created_at timestamptz not null default now()
);

create index reservation_preorder_items_branch_id_idx on public.reservation_preorder_items (branch_id);
create index reservation_preorder_items_reservation_id_idx on public.reservation_preorder_items (reservation_id);

alter table public.reservation_preorder_items enable row level security;

create policy reservation_preorder_items_select on public.reservation_preorder_items
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('view_reservations'));

create policy reservation_preorder_items_insert on public.reservation_preorder_items
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_reservations'));

create policy reservation_preorder_items_delete on public.reservation_preorder_items
  for delete to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_reservations'));
