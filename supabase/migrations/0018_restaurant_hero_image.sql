-- صورة Hero لصفحة الموقع العام الرئيسية `/site` — تُرفع من إعدادات المطعم
-- وتُخزَّن في bucket `menu-images` العام الموجود مسبقاً (المرحلة 4).
alter table public.restaurants add column hero_image_url text;
