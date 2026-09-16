"use server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { extractReceiptAmount } from "@/lib/ocr/extract-receipt-amount";
import { normalizeSaudiPhone } from "@/lib/domain/phone";
import type { ActionResult } from "@/lib/actions/types";

// يُستدعى من صفحة الولاء العامة بعد تسجيل دخول Google، مع رقم هاتف يُدخله
// العميل يدوياً (لا OTP) — ينشئ عضوية بهذا الهاتف في هذا المطعم إن لم تكن
// موجودة، أو يربطها بالجلسة الحالية (عبر RPC أمنية join_loyalty_member في
// 0019_loyalty_google_auth.sql). التطبيع هنا إلزامي: الدالة تطابق الأعضاء
// بمساواة نصية تامة للهاتف، فبدونه تُنشأ عضوية مكررة لكل صيغة إدخال مختلفة.
export async function joinLoyaltyMember(restaurantId: string, phone: string): Promise<ActionResult> {
  const normalizedPhone = normalizeSaudiPhone(phone);
  if (!normalizedPhone) return { success: false, error: "رقم الهاتف غير صالح" };

  const supabase = await createClient();
  const { error } = await supabase.rpc("join_loyalty_member", {
    p_restaurant_id: restaurantId,
    p_phone: normalizedPhone,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

// يرفع صورة الفاتورة إلى bucket خاص (loyalty-receipts)، يستخرج المبلغ ورقم
// الفاتورة عبر OCR (بعد التحقق من هوية المطعم)، ثم يسجّل النتيجة ويمنح النقاط
// ذرّياً عبر submit_loyalty_receipt (نجاحاً أو فشلاً معاً — لا فرع كود منفصل
// لكل حالة، الدالة أدناه تتكفّل بالاثنين). اسم المطعم لبرومبت الـOCR عبر
// عميل admin (لا عميل الجلسة العادي) — العضو (Google-auth) دوره authenticated
// بلا أي سياسة RLS تمنحه قراءة restaurants/branches (المتاح لهذا الدور محصور
// بالموظفين عبر auth_branch_ids/profiles؛ سياسات anon العامة في 0008 لا تشمل
// authenticated)، فالاستعلام بعميل الجلسة سيُرجع null دائماً لعضو ولاء حقيقي.
export async function submitLoyaltyReceipt(
  memberId: string,
  branchId: string,
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "invalid file" };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${branchId}/${memberId}/${randomUUID()}.${ext}`;

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from("loyalty-receipts")
    .upload(path, bytes, { contentType: file.type, upsert: false });
  if (uploadError) return { success: false, error: uploadError.message };

  const { data: branch } = await admin
    .from("branches")
    .select("restaurant_id")
    .eq("id", branchId)
    .single();
  if (!branch) return { success: false, error: "فرع غير صالح" };

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("name_ar, name_en")
    .eq("id", branch.restaurant_id)
    .single();
  if (!restaurant) return { success: false, error: "مطعم غير صالح" };

  const { amount, invoiceNumber, note } = await extractReceiptAmount(
    bytes,
    file.type,
    restaurant.name_ar,
    restaurant.name_en
  );

  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc("submit_loyalty_receipt", {
      p_member_id: memberId,
      p_branch_id: branchId,
      p_receipt_image_path: path,
      p_extracted_amount: amount,
      p_invoice_number: invoiceNumber,
      p_ocr_note: note,
    })
    .single();

  if (error) return { success: false, error: error.message };
  if (data.status === "rejected") {
    // ocr_note من صف الـRPC نفسه لا من متغيّر note أعلاه — قد يختلفان (مثال:
    // استخراج ناجح لكن رقم الفاتورة مكرر، فالرفض يأتي من الدالة نفسها برسالة
    // مختلفة عن نتيجة استخراج ناجحة بلا ملاحظة).
    return { success: false, error: data.ocr_note ?? "تعذّر قراءة الفاتورة" };
  }

  return { success: true };
}

export async function redeemLoyaltyReward(rewardId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_loyalty_reward", { p_reward_id: rewardId });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
