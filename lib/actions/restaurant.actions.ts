"use server";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getProfile } from "@/lib/auth/getProfile";
import { actionMsg, invalidDataError } from "@/lib/i18n/action-messages";
import { restaurantSchema, type RestaurantInput } from "@/lib/validation/restaurant.schema";
import type { ActionResult } from "@/lib/actions/types";

// بلا سياسة INSERT على restaurants عمداً — الإنشاء الأول يتم عبر RPC ذرّي
// واحد (bootstrap_restaurant) يجعل المستخدم الحالي مالكاً دفعة واحدة.
export async function bootstrapRestaurant(input: RestaurantInput): Promise<ActionResult> {
  const parsed = restaurantSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const profile = await getProfile();
  if (!profile) return { success: false, error: await actionMsg("common.sessionExpired") };
  if (profile.restaurantId) return { success: false, error: await actionMsg("common.unauthorized") };

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("bootstrap_restaurant", {
    p_name_ar: parsed.data.nameAr,
    p_name_en: parsed.data.nameEn,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard");
  return { success: true, id: data as string };
}

export async function updateRestaurant(id: string, input: RestaurantInput): Promise<ActionResult> {
  const parsed = restaurantSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("restaurants")
    .update({
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
      about_ar: parsed.data.aboutAr || null,
      about_en: parsed.data.aboutEn || null,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/restaurant");
  return { success: true };
}

export async function uploadRestaurantHeroImage(restaurantId: string, formData: FormData): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  // نفس نمط uploadItemImage: نتحقق من وجود الصف عبر عميل مصادَق (RLS تمنع
  // غير المخوَّل من الوصول)، ثم عميل admin للرفع فقط لأن bucket التخزين
  // بلا سياسات RLS مضبوطة بعد.
  const { data: restaurant } = await supabase.from("restaurants").select("id").eq("id", restaurantId).single();
  if (!restaurant) return { success: false, error: await invalidDataError() };

  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `restaurant/${restaurantId}/hero/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("menu-images")
    .upload(path, await file.arrayBuffer(), { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: uploadError.message };

  const { data: publicUrl } = admin.storage.from("menu-images").getPublicUrl(path);

  const { error: updateError } = await supabase
    .from("restaurants")
    .update({ hero_image_url: publicUrl.publicUrl })
    .eq("id", restaurantId);
  if (updateError) return { success: false, error: updateError.message };

  revalidatePath("/restaurant");
  revalidatePath("/site");
  return { success: true };
}
