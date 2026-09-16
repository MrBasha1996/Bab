"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { invalidDataError } from "@/lib/i18n/action-messages";
import { menuSchema, menuScheduleSchema, type MenuInput, type MenuScheduleInput } from "@/lib/validation/menu.schema";
import type { ActionResult } from "@/lib/actions/types";

export async function createMenu(input: MenuInput): Promise<ActionResult> {
  const parsed = menuSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { data: menu, error } = await supabase
    .from("menus")
    .insert({ branch_id: parsed.data.branchId, name_ar: parsed.data.nameAr, name_en: parsed.data.nameEn })
    .select("id")
    .single();

  if (error || !menu) return { success: false, error: error?.message };

  revalidatePath("/menus");
  redirect(`/menus/${menu.id}`);
}

export async function updateMenu(id: string, input: MenuInput): Promise<ActionResult> {
  const parsed = menuSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menus")
    .update({ name_ar: parsed.data.nameAr, name_en: parsed.data.nameEn })
    .eq("id", id);

  if (error) return { success: false, error: error.message };

  revalidatePath("/menus");
  revalidatePath(`/menus/${id}`);
  return { success: true };
}

export async function addMenuSchedule(
  menuId: string,
  branchId: string,
  input: MenuScheduleInput
): Promise<ActionResult> {
  const parsed = menuScheduleSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: await invalidDataError() };

  const supabase = await createClient();
  const { error } = await supabase.from("menu_schedules").insert({
    menu_id: menuId,
    branch_id: branchId,
    day_of_week: parsed.data.dayOfWeek,
    start_time: parsed.data.startTime,
    end_time: parsed.data.endTime,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/menus/${menuId}`);
  return { success: true };
}

export async function deleteMenuSchedule(scheduleId: string, menuId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("menu_schedules").delete().eq("id", scheduleId);

  if (error) return { success: false, error: error.message };

  revalidatePath(`/menus/${menuId}`);
  return { success: true };
}
