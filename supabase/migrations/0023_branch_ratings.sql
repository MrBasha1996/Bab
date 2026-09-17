-- المرحلة 23: تقييم داخلي للفرع (نجوم 1-5 + تعليق اختياري) من بوابة QR/Tablet،
-- بالإضافة لزر التوجيه الخارجي الموجود أصلاً لخرائط قوقل (google_reviews_url في 0017).
-- نفس نمط complaints في 0017: كتابة anon فقط بلا RETURNING، قراءة authenticated
-- بصلاحية جديدة ونطاق auth_branch_ids().

create table public.branch_ratings (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches(id) on delete cascade,
  table_id uuid references public.tables(id) on delete set null,
  stars smallint not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index branch_ratings_branch_id_idx on public.branch_ratings (branch_id);

alter table public.branch_ratings enable row level security;

create policy branch_ratings_insert_public on public.branch_ratings
  for insert to anon with check (true);

create policy branch_ratings_select on public.branch_ratings
  for select to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('view_ratings'));

insert into public.role_capabilities (role_id, capability_key)
select id, capability_key
from public.roles, unnest(array['view_ratings']) as capability_key
where key in ('owner', 'branch_manager');
