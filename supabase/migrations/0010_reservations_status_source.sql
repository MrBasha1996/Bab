-- المرحلة 10: تمييز مصدر حجز الأفراد (موقع/هاتف/حضور مباشر) وتتبع حالته
-- (قيد المراجعة/مؤكد/ملغى). قيم افتراضية تحافظ على سلوك الصفوف الحالية
-- (source='phone', status='confirmed') بلا كسر توافق.

alter table public.reservations
  add column source text not null default 'phone'
    check (source in ('website', 'phone', 'walk_in')),
  add column status text not null default 'confirmed'
    check (status in ('pending', 'confirmed', 'cancelled'));

-- لا سياسة update سابقة على reservations (المرحلة 5 كانت إنشاء/عرض فقط)؛
-- تغيير status يحتاجها الآن، بنفس شرط manage_reservations المستخدم في insert.
create policy reservations_update on public.reservations
  for update to authenticated
  using (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_reservations'))
  with check (branch_id = any(public.auth_branch_ids()) and public.has_capability('manage_reservations'));
