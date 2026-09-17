-- تحسين وجاهزية إنتاج - المرحلة I، بند 2: RLS صريحة على bucket menu-images
-- (كان بلا أي policy موثَّق كدين تقني في tasks/todo.md). storage.objects تحمل
-- RLS مفعّلة افتراضياً في Supabase بلا policies = رفض ضمني لأي عملية من
-- anon/authenticated أصلاً (كل الرفع/الحذف الحالي يمر حصراً عبر service_role
-- في lib/actions/*.actions.ts الذي يتجاوز RLS بطبيعته) — هذه الهجرة توثّق
-- ذلك صراحة بدل الاعتماد على سلوك افتراضي ضمني، وتضيف سياسة قراءة صريحة
-- تطابق سلوك الـpublic bucket الفعلي (القراءة العامة تمر أصلاً عبر endpoint
-- منفصل /storage/v1/object/public/ بمعزل عن RLS، لكن توضيحها هنا يمنع أي
-- التباس مستقبلي عند مراجعة الصلاحيات).

create policy "menu_images_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'menu-images');
