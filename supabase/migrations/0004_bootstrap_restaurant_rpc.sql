-- لا توجد سياسة INSERT على restaurants عمداً (لا معنى لمطعم "بلا مالك" في
-- هذا النموذج). التسجيل الأول يتم عبر RPC ذرّي واحد: ينشئ المطعم، ويجعل
-- المستخدم الحالي مالكه (owner) دفعة واحدة، ويرفض التكرار إن كان له مطعم أصلاً.

create function public.bootstrap_restaurant(p_name_ar text, p_name_en text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_restaurant_id uuid;
  v_owner_role_id uuid;
  v_existing uuid;
begin
  select restaurant_id into v_existing from public.profiles where id = auth.uid();
  if v_existing is not null then
    raise exception 'profile already has a restaurant';
  end if;

  select id into v_owner_role_id from public.roles where key = 'owner';

  insert into public.restaurants (name_ar, name_en) values (p_name_ar, p_name_en)
  returning id into v_restaurant_id;

  update public.profiles
  set restaurant_id = v_restaurant_id, role_id = v_owner_role_id
  where id = auth.uid();

  return v_restaurant_id;
end;
$$;

revoke all on function public.bootstrap_restaurant(text, text) from public;
grant execute on function public.bootstrap_restaurant(text, text) to authenticated;
