-- إصلاح: سياستا branches_select/branches_update في 0002 تعتمدان على
-- auth_branch_ids()، والتي تستعلم جدول branches نفسه — مرجعية ذاتية تسبّب
-- عدم رؤية الصف المُدرَج حديثاً ضمن RETURNING لنفس أمر INSERT (RLS يطبّق
-- سياسة SELECT على RETURNING، وexists-subquery الذاتية على نفس الجدول لا
-- تُرجع الصف الجديد ضمن نفس الأمر بشكل موثوق). الحل: صياغة مباشرة بلا
-- استعلام ذاتي على branches — auth_branch_ids() يبقى صالحاً وآمناً للاستخدام
-- من جداول أخرى (tables, menus, ...) لأنه ليس مرجعية ذاتية هناك.

drop policy branches_select on public.branches;
drop policy branches_update on public.branches;

create policy branches_select on public.branches
  for select to authenticated
  using (
    id = (select branch_id from public.profiles where id = auth.uid())
    or (
      restaurant_id = (select restaurant_id from public.profiles where id = auth.uid())
      and exists (
        select 1 from public.profiles p
        join public.roles r on r.id = p.role_id
        where p.id = auth.uid() and r.scope_type = 'restaurant'
      )
    )
  );

create policy branches_update on public.branches
  for update to authenticated
  using (
    (
      id = (select branch_id from public.profiles where id = auth.uid())
      or (
        restaurant_id = (select restaurant_id from public.profiles where id = auth.uid())
        and exists (
          select 1 from public.profiles p
          join public.roles r on r.id = p.role_id
          where p.id = auth.uid() and r.scope_type = 'restaurant'
        )
      )
    )
    and public.has_capability('manage_branches')
  )
  with check (
    restaurant_id = (select restaurant_id from public.profiles where id = auth.uid())
    and public.has_capability('manage_branches')
  );
