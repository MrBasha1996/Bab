-- المرحلة 14.7: منع رفع نفس الفاتورة أكثر من مرة (حتى من عضو ولاء مختلف).
-- رقم الفاتورة يُستخرج الآن عبر OCR (extract-receipt-amount.ts) مع اسم
-- المطعم للتحقق من الهوية أولاً — راجع 14.7 في tasks/todo.md.

alter table public.loyalty_receipt_submissions add column invoice_number text;

-- فريد على مستوى المطعم كله (كل الفروع، كل الأعضاء) لا على مستوى الفرع أو
-- العضو — نفس رقم الفاتورة لا يجوز رفعه مرتين بصرف النظر عمّن رفعه. جزئي
-- (where invoice_number is not null) لأن الصفوف المرفوضة بسبب فشل قراءة
-- الرقم تُخزَّن بقيمة null ولا يجوز أن تتعارض فيما بينها.
create unique index loyalty_receipt_submissions_invoice_number_key
  on public.loyalty_receipt_submissions (restaurant_id, invoice_number)
  where invoice_number is not null;

drop function public.submit_loyalty_receipt(uuid, uuid, text, numeric, text);

-- RPC 2 (معدَّلة): تستقبل الآن p_invoice_number أيضاً. مصدر الحقيقة الوحيد
-- لمنع التكرار هو فهرس UNIQUE أعلاه (لا فحص select مسبق منفصل — كان سيبقى
-- عرضة لسباق تزامن، والفهرس سيرفض الإدراج المكرر على أي حال حتى لو مرّ
-- الفحص المسبق، فإبقاؤه كان سيكون كوداً ميتاً فعلياً). الإدراج يُحاط بـ
-- `exception when unique_violation`: عند التقاطها تُحوَّل النتيجة لصف
-- 'rejected' بلا نقاط، ويُعاد الإدراج **برقم فاتورة null** (لا يمكن تخزين
-- الرقم الفعلي في صف ثانٍ بلا كسر نفس القيد الذي اكتشف التكرار للتو) مع ذكر
-- الرقم داخل `ocr_note` نفسه للحفاظ على أثر تدقيقي كامل. `ocr_note` أصبح
-- جزءاً من القيمة المُعادة من الدالة (لم يكن من قبل) لأن رسالة الرفض قد تُبنى
-- الآن داخل الدالة نفسها (تكرار الرقم) لا فقط من نتيجة الـOCR الممرَّرة من
-- الخارج.
create function public.submit_loyalty_receipt(
  p_member_id uuid,
  p_branch_id uuid,
  p_receipt_image_path text,
  p_extracted_amount numeric,
  p_invoice_number text,
  p_ocr_note text
)
returns table (submission_id uuid, points_awarded integer, status text, ocr_note text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_member_restaurant_id uuid;
  v_branch_restaurant_id uuid;
  v_rate numeric;
  v_points integer;
  v_status text;
  v_ocr_note text;
  v_submission_id uuid;
begin
  select restaurant_id into v_member_restaurant_id
  from public.loyalty_members
  where id = p_member_id and auth_user_id = auth.uid();

  if v_member_restaurant_id is null then
    raise exception 'عضوية غير صالحة لهذه الجلسة';
  end if;

  select restaurant_id into v_branch_restaurant_id from public.branches where id = p_branch_id;

  if v_branch_restaurant_id is null or v_branch_restaurant_id <> v_member_restaurant_id then
    raise exception 'الفرع لا يتبع مطعم هذه العضوية';
  end if;

  v_ocr_note := p_ocr_note;

  if p_extracted_amount is null or p_invoice_number is null then
    v_status := 'rejected';
    v_points := 0;
  else
    v_status := 'approved';
    select points_per_currency_unit into v_rate
    from public.loyalty_settings where restaurant_id = v_member_restaurant_id;
    v_points := floor(p_extracted_amount * coalesce(v_rate, 1))::integer;
  end if;

  begin
    insert into public.loyalty_receipt_submissions
      (restaurant_id, branch_id, member_id, receipt_image_path, extracted_amount, invoice_number, points_awarded, status, ocr_note)
    values
      (v_member_restaurant_id, p_branch_id, p_member_id, p_receipt_image_path, p_extracted_amount, p_invoice_number, v_points, v_status, v_ocr_note)
    returning id into v_submission_id;
  exception when unique_violation then
    v_status := 'rejected';
    v_points := 0;
    v_ocr_note := 'رقم الفاتورة ' || p_invoice_number || ' تم استخدامه من قبل';
    insert into public.loyalty_receipt_submissions
      (restaurant_id, branch_id, member_id, receipt_image_path, extracted_amount, invoice_number, points_awarded, status, ocr_note)
    values
      (v_member_restaurant_id, p_branch_id, p_member_id, p_receipt_image_path, p_extracted_amount, null, v_points, v_status, v_ocr_note)
    returning id into v_submission_id;
  end;

  if v_status = 'approved' and v_points > 0 then
    update public.loyalty_members
    set points_balance = points_balance + v_points
    where id = p_member_id;
  end if;

  return query select v_submission_id, v_points, v_status, v_ocr_note;
end;
$$;

revoke all on function public.submit_loyalty_receipt(uuid, uuid, text, numeric, text, text) from public;
grant execute on function public.submit_loyalty_receipt(uuid, uuid, text, numeric, text, text) to authenticated;
