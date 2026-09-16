"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/auth/getProfile";
import { actionMsg, invalidDataError } from "@/lib/i18n/action-messages";
import { branchSchema, type BranchInput } from "@/lib/validation/branch.schema";
import type { ActionResult } from "@/lib/actions/types";

// يطابق منطق تعبئة slug الفروع الموجودة في هجرة 0005_tables_qr.sql — الرابط
// العام لرموز QR يعتمد عليه ولا يُعدَّل من الواجهة لاحقاً.
function slugify(nameEn: string): string {
  return nameEn
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function createBranch(input: BranchInput): Promise<ActionResult> {
  const parsed = branchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const profile = await getProfile();
  if (!profile?.restaurantId) return { success: false, error: await actionMsg("common.sessionExpired") };

  const supabase = await createClient();
  const { error } = await supabase.from("branches").insert({
    restaurant_id: profile.restaurantId,
    name_ar: parsed.data.nameAr,
    name_en: parsed.data.nameEn,
    address_ar: parsed.data.addressAr || null,
    address_en: parsed.data.addressEn || null,
    phone: parsed.data.phone || null,
    google_reviews_url: parsed.data.googleReviewsUrl || null,
    google_maps_url: parsed.data.googleMapsUrl || null,
    timezone: parsed.data.timezone,
    slug: slugify(parsed.data.nameEn),
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/branches");
  redirect("/branches");
}

export async function updateBranch(id: string, input: BranchInput): Promise<ActionResult> {
  const parsed = branchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("branches")
    .update({
      name_ar: parsed.data.nameAr,
      name_en: parsed.data.nameEn,
      address_ar: parsed.data.addressAr || null,
      address_en: parsed.data.addressEn || null,
      phone: parsed.data.phone || null,
      google_reviews_url: parsed.data.googleReviewsUrl || null,
      google_maps_url: parsed.data.googleMapsUrl || null,
      timezone: parsed.data.timezone,
    })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/branches");
  revalidatePath(`/branches/${id}`);
  return { success: true };
}
