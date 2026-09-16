-- استبدال join_loyalty_member(uuid) بتوقيع جديد يقبل رقم الهاتف كمعامل
-- صريح بدل قراءته من auth.users.phone — الهوية تحولت من Phone+OTP إلى
-- Google Sign-in (المرحلة 14.6 في tasks/todo.md)، ومستخدمو Google لا يملكون
-- auth.users.phone إطلاقاً. لا تعديل على 0015_loyalty.sql المطبَّقة فعلاً.
drop function if exists public.join_loyalty_member(uuid);

create function public.join_loyalty_member(p_restaurant_id uuid, p_phone text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_phone text := trim(p_phone);
  v_member_id uuid;
  v_current_auth_user_id uuid;
begin
  if v_phone is null or v_phone = '' then
    raise exception 'رقم الهاتف مطلوب';
  end if;

  select id, auth_user_id into v_member_id, v_current_auth_user_id
  from public.loyalty_members
  where restaurant_id = p_restaurant_id and phone = v_phone;

  if v_member_id is null then
    insert into public.loyalty_members (restaurant_id, phone, auth_user_id)
    values (p_restaurant_id, v_phone, auth.uid())
    returning id into v_member_id;
  elsif v_current_auth_user_id is distinct from auth.uid() then
    update public.loyalty_members set auth_user_id = auth.uid() where id = v_member_id;
  end if;

  return v_member_id;
end;
$$;

revoke all on function public.join_loyalty_member(uuid, text) from public;
grant execute on function public.join_loyalty_member(uuid, text) to authenticated;
