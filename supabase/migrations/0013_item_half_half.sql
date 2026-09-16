-- المرحلة 12: نصف/نصف — يسمح للعميل عند Pre-order باختيار نصفين من صنفين
-- مختلفين (بدل صنف واحد كامل)، مقيَّد بأصناف يحددها صاحب المطعم صراحة
-- (is_splittable) ويشتركان في فئة واحدة على الأقل (يُتحقَّق منه في كود
-- Server Action لا في قيد DB، لأن menu_category_items علاقة N:N).
-- التسعير (الأعلى بين النصفين) يُحسب عند العرض فقط، بلا تخزين — نفس مبدأ
-- "بلا سعر مخزَّن" من المرحلة 11.

alter table public.menu_items
  add column is_splittable boolean not null default false;

alter table public.reservation_preorder_items
  add column second_menu_item_id uuid references public.menu_items(id) on delete cascade,
  add column second_item_variant_id uuid references public.item_variants(id) on delete set null;
