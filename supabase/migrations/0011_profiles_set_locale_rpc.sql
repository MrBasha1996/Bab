-- تحديث ذاتي للغة الواجهة (profiles.locale) بدل الاعتماد على كوكي المتصفح
-- فقط — تنتقل مع المستخدم بين الأجهزة. security definer مقصور على صف صاحب
-- الجلسة (auth.uid())، فلا يمكن لمستخدم تغيير لغة غيره.

create or replace function public.set_my_locale(p_locale text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_locale not in ('ar', 'en') then
    raise exception 'لغة غير صالحة: %', p_locale;
  end if;

  update public.profiles
    set locale = p_locale
    where id = auth.uid();
end;
$$;

revoke execute on function public.set_my_locale(text) from public, anon;
grant execute on function public.set_my_locale(text) to authenticated;
