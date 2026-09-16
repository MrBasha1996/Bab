-- استبدال مكافأة يبادر به الموظف مباشرة من صفحة مسح QR الخاصة بالعميل
-- (app/(app)/loyalty/scan/[memberId])، بخلاف redeem_loyalty_reward في
-- 0015_loyalty.sql التي تعتمد على auth.uid() = العميل نفسه ولا يمكن للموظف
-- استدعاءها نيابة عنه. الاستبدال هنا يُنشأ بحالة 'fulfilled' مباشرة (لا
-- 'pending') لأن الموظف ينفّذه حضورياً أمام العميل، بخلاف تدفق العميل
-- الذاتي الذي يحتاج تأكيد تسليم لاحق.
create function public.redeem_loyalty_reward_for_member(p_member_id uuid, p_reward_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_restaurant_id uuid;
  v_reward_restaurant_id uuid;
  v_points_cost integer;
  v_is_active boolean;
  v_updated_member_id uuid;
  v_redemption_id uuid;
begin
  if not public.has_capability('manage_loyalty') then
    raise exception 'لا تملك صلاحية إدارة الولاء';
  end if;

  select restaurant_id into v_member_restaurant_id
  from public.loyalty_members
  where id = p_member_id;

  if v_member_restaurant_id is null or v_member_restaurant_id <> public.auth_restaurant_id() then
    raise exception 'العضو غير متاح لهذا المطعم';
  end if;

  select restaurant_id, points_cost, is_active into v_reward_restaurant_id, v_points_cost, v_is_active
  from public.loyalty_rewards where id = p_reward_id;

  if v_reward_restaurant_id is null or v_reward_restaurant_id <> v_member_restaurant_id or not v_is_active then
    raise exception 'المكافأة غير متاحة لهذا المطعم';
  end if;

  update public.loyalty_members
  set points_balance = points_balance - v_points_cost
  where id = p_member_id and points_balance >= v_points_cost
  returning id into v_updated_member_id;

  if v_updated_member_id is null then
    raise exception 'الرصيد غير كافٍ لاستبدال هذه المكافأة';
  end if;

  insert into public.loyalty_redemptions (restaurant_id, member_id, reward_id, points_spent, status)
  values (v_member_restaurant_id, p_member_id, p_reward_id, v_points_cost, 'fulfilled')
  returning id into v_redemption_id;

  return v_redemption_id;
end;
$$;

revoke all on function public.redeem_loyalty_reward_for_member(uuid, uuid) from public;
grant execute on function public.redeem_loyalty_reward_for_member(uuid, uuid) to authenticated;
