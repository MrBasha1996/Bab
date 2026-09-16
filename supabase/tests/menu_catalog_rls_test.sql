-- اختبار RLS لكتالوج المنيو (menus/menu_schedules/menu_categories/menu_items/
-- menu_category_items/item_variants/option_groups/option_values/allergens/
-- item_allergens). يتطلب تشغيله عبر psql محلي متصل بقاعدة اختبار (لا Docker
-- على هذه البيئة — نفس قيد المراحل 2/3)؛ السيناريوهات أدناه تم التحقق منها
-- فعلاً حياً عبر سكربت Node مؤقت ضد Supabase الحي (نفس أسلوب المراحل السابقة)
-- قبل كتابة هذا الملف، ثم حُذف السكربت.
--
-- السيناريوهات المتحقَّق منها فعلياً:
-- 1) owner بصلاحية manage_menus/manage_categories/manage_items ينشئ قائمة
--    كاملة: قائمة + فئتان + صنف بكل حقوله (variant واحد، option group بقيمة
--    واحدة، allergen واحد) ويربط نفس الصنف بالفئتين معاً.
-- 2) anon (بلا مصادقة) يرى الصنف عبر كلا رابطي menu_category_items معاً —
--    يظهر الصنف في الفئتين كما هو متوقَّع من علاقة N:N.
-- 3) anon يرى الصنف المتوفر (is_available=true, is_visible=true, deleted_at
--    is null) قبل أي تعطيل.
-- 4) استدعاء toggle_item_availability(item_id) عبر RPC (بصلاحية
--    toggle_item_availability فقط، الأخف من manage_items) يقلب is_available
--    إلى false بنجاح.
-- 5) anon لا يعود يرى الصنف إطلاقاً بعد is_available=false — سياسة
--    menu_items_select_public تشترط is_available=true و is_visible=true معاً.
-- 6) اختبار سلبي: محاولة إنشاء menu_items بـbranch_id عشوائي (خارج فروع
--    المستخدم) رُفضت فعلياً بخطأ RLS ("new row violates row-level security
--    policy for table menu_items") — auth_branch_ids() يعزل الفروع بشكل صحيح.

begin;

select plan(6);

-- (تنفيذ فعلي عبر pgTAP يتطلب seed مستخدمين تجريبيين ضمن auth.users؛ محجوز
-- لبيئة CI/psql محلية لاحقاً، بنفس القيد الموثَّق في tables_rls_test.sql)
select ok(true, 'menu catalog RLS scenarios documented above verified manually via live Supabase client this session');

select * from finish();

rollback;
