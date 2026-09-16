-- إضافة "site" كمصدر مسموح لأحداث مشاهدة الصنف، لدعم صفحة منيو العرض على
-- الموقع العام (/site/menu) التي لا ترتبط بجلسة QR أو تابلت.

alter table public.menu_item_view_events drop constraint menu_item_view_events_source_check;
alter table public.menu_item_view_events add constraint menu_item_view_events_source_check
  check (source in ('qr', 'tablet', 'site'));
