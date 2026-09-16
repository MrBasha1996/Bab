-- إضافة رابط تضمين خريطة جوجل لكل فرع (يُدخله الأدمن يدوياً)، بنفس نمط
-- google_reviews_url في 0017_gateway_feedback.sql — يُستخدم لعرض خريطة الفرع
-- في الموقع العام (/site) دون الحاجة لإحداثيات أو Geocoding.

alter table public.branches add column google_maps_url text;
