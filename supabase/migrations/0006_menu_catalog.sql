-- المرحلة 4: كتالوج المنيو (menus/categories/items/variants/options/allergens).
-- كل حقل نصي يظهر في المنيو العامة يُخزَّن بعمودين _ar/_en إلزاميين (راجع CLAUDE.md).
-- كل جدول يحمل branch_id مباشرة (denormalized) لتبسيط RLS، بنفس نمط 0005_tables_qr.

create table public.menus (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index menus_branch_id_idx on public.menus (branch_id);

-- جدولة القائمة: صفوف متعددة لكل menu (مثلاً أيام/فترات مختلفة). عدم وجود أي
-- صف جدولة لقائمة يعني أنها نشطة دائماً (بلا قيد وقت) — منطق القرار في
-- lib/domain/menu-schedule.ts. day_of_week: 0=الأحد .. 6=السبت (ISO مع
-- تحويل بسيط في الكود). end_time قد تكون أصغر من start_time لفترة عابرة
-- لمنتصف الليل (مثلاً 22:00 → 02:00).
create table public.menu_schedules (
  id uuid primary key default gen_random_uuid(),
  menu_id uuid not null references public.menus(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);

create index menu_schedules_menu_id_idx on public.menu_schedules (menu_id);
create index menu_schedules_branch_id_idx on public.menu_schedules (branch_id);

create table public.menu_categories (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  menu_id uuid not null references public.menus(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index menu_categories_menu_id_idx on public.menu_categories (menu_id);
create index menu_categories_branch_id_idx on public.menu_categories (branch_id);

-- الصنف يتبع الفرع مباشرة، وليس قائمة واحدة بعينها — نفس الصنف قد يظهر في
-- أكثر من فئة (ولو من قوائم مختلفة) عبر menu_category_items أدناه.
-- is_available: تبديل سريع "غير متوفر" (صلاحية toggle_item_availability).
-- is_visible: إخفاء دائم عن المنيو العام (صلاحية manage_items الكاملة) — منفصل
-- عمداً عن is_available لأن الأول تشغيلي يومي والثاني قرار محتوى.
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  description_ar text,
  description_en text,
  price numeric(10, 2) not null check (price >= 0),
  calories integer check (calories is null or calories >= 0),
  image_url text,
  is_available boolean not null default true,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index menu_items_branch_id_idx on public.menu_items (branch_id);

create table public.menu_category_items (
  category_id uuid not null references public.menu_categories(id) on delete cascade,
  item_id uuid not null references public.menu_items(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (category_id, item_id)
);

create index menu_category_items_item_id_idx on public.menu_category_items (item_id);
create index menu_category_items_branch_id_idx on public.menu_category_items (branch_id);

create table public.item_variants (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.menu_items(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  price numeric(10, 2) not null check (price >= 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index item_variants_item_id_idx on public.item_variants (item_id);
create index item_variants_branch_id_idx on public.item_variants (branch_id);

create table public.option_groups (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.menu_items(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  is_required boolean not null default false,
  min_select integer not null default 0,
  max_select integer not null default 1,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint option_groups_select_range check (min_select >= 0 and max_select >= min_select)
);

create index option_groups_item_id_idx on public.option_groups (item_id);
create index option_groups_branch_id_idx on public.option_groups (branch_id);

create table public.option_values (
  id uuid primary key default gen_random_uuid(),
  option_group_id uuid not null references public.option_groups(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  name_ar text not null,
  name_en text not null,
  price_delta numeric(10, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index option_values_option_group_id_idx on public.option_values (option_group_id);
create index option_values_branch_id_idx on public.option_values (branch_id);

-- المُسبِّبات (allergens): قائمة مرجعية عامة غير مرتبطة بمطعم بعينه (بنفس نمط
-- roles/role_capabilities في 0001) — تُدار عبر هجرات لاحقة عند الحاجة، لا واجهة
-- تعديل لها في هذه المرحلة.
create table public.allergens (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text not null,
  icon_url text,
  created_at timestamptz not null default now()
);

create table public.item_allergens (
  item_id uuid not null references public.menu_items(id) on delete cascade,
  allergen_id uuid not null references public.allergens(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete cascade,
  primary key (item_id, allergen_id)
);

create index item_allergens_branch_id_idx on public.item_allergens (branch_id);

-- bucket تخزين صور الأصناف/الشعارات، عام القراءة (الصور تظهر في المنيو العام
-- بلا مصادقة) وكتابة عبر service role فقط (Server Actions تستخدم عميل admin).
insert into storage.buckets (id, name, public)
values ('menu-images', 'menu-images', true)
on conflict (id) do nothing;

alter table public.menus enable row level security;
alter table public.menu_schedules enable row level security;
alter table public.menu_categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_category_items enable row level security;
alter table public.item_variants enable row level security;
alter table public.option_groups enable row level security;
alter table public.option_values enable row level security;
alter table public.allergens enable row level security;
alter table public.item_allergens enable row level security;

-- menus
create policy menus_select on public.menus
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy menus_select_public on public.menus
  for select to anon using (deleted_at is null);

create policy menus_insert on public.menus
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_menus'));

create policy menus_update on public.menus
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_menus'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_menus'));

-- menu_schedules
create policy menu_schedules_select on public.menu_schedules
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy menu_schedules_select_public on public.menu_schedules
  for select to anon using (true);

create policy menu_schedules_insert on public.menu_schedules
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_menus'));

create policy menu_schedules_update on public.menu_schedules
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_menus'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_menus'));

create policy menu_schedules_delete on public.menu_schedules
  for delete to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_menus'));

-- menu_categories
create policy menu_categories_select on public.menu_categories
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy menu_categories_select_public on public.menu_categories
  for select to anon using (deleted_at is null);

create policy menu_categories_insert on public.menu_categories
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_categories'));

create policy menu_categories_update on public.menu_categories
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_categories'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_categories'));

-- menu_items: anon لا يرى إلا المتوفر والظاهر معاً.
create policy menu_items_select on public.menu_items
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy menu_items_select_public on public.menu_items
  for select to anon using (deleted_at is null and is_available = true and is_visible = true);

create policy menu_items_insert on public.menu_items
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy menu_items_update on public.menu_items
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

-- menu_category_items
create policy menu_category_items_select on public.menu_category_items
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy menu_category_items_select_public on public.menu_category_items
  for select to anon using (true);

create policy menu_category_items_insert on public.menu_category_items
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_categories'));

create policy menu_category_items_delete on public.menu_category_items
  for delete to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_categories'));

-- item_variants
create policy item_variants_select on public.item_variants
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy item_variants_select_public on public.item_variants
  for select to anon using (true);

create policy item_variants_insert on public.item_variants
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy item_variants_update on public.item_variants
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy item_variants_delete on public.item_variants
  for delete to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

-- option_groups
create policy option_groups_select on public.option_groups
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy option_groups_select_public on public.option_groups
  for select to anon using (true);

create policy option_groups_insert on public.option_groups
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy option_groups_update on public.option_groups
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy option_groups_delete on public.option_groups
  for delete to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

-- option_values
create policy option_values_select on public.option_values
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy option_values_select_public on public.option_values
  for select to anon using (true);

create policy option_values_insert on public.option_values
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy option_values_update on public.option_values
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy option_values_delete on public.option_values
  for delete to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

-- allergens: مرجعية عامة، قراءة فقط للجميع (بلا كتابة عبر RLS في هذه المرحلة).
create policy allergens_select on public.allergens
  for select to authenticated using (true);

create policy allergens_select_public on public.allergens
  for select to anon using (true);

-- item_allergens
create policy item_allergens_select on public.item_allergens
  for select to authenticated using (branch_id = any(public.auth_branch_ids()));

create policy item_allergens_select_public on public.item_allergens
  for select to anon using (true);

create policy item_allergens_insert on public.item_allergens
  for insert to authenticated
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

create policy item_allergens_delete on public.item_allergens
  for delete to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_items'));

-- تبديل سريع "غير متوفر": صلاحية أخف (toggle_item_availability) لا تملك
-- UPDATE كاملة على menu_items (تلك مقصورة على manage_items) — RPC واحد
-- security definer يقلب is_available فقط، بنفس نمط bootstrap_restaurant في 0004.
create function public.toggle_item_availability(p_item_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_branch_id uuid;
  v_new_value boolean;
begin
  select branch_id into v_branch_id from public.menu_items where id = p_item_id;

  if v_branch_id is null then
    raise exception 'الصنف غير موجود';
  end if;

  if not (v_branch_id = any(public.auth_branch_ids())) then
    raise exception 'لا صلاحية على هذا الفرع';
  end if;

  if not (public.has_capability('toggle_item_availability') or public.has_capability('manage_items')) then
    raise exception 'لا صلاحية لتبديل توفر الصنف';
  end if;

  update public.menu_items
  set is_available = not is_available
  where id = p_item_id
  returning is_available into v_new_value;

  return v_new_value;
end;
$$;
