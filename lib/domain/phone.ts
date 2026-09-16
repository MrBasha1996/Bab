// يقبل صيغ الهاتف السعودي الشائعة (05x، 5x، 9665x، 96605x، +9665x، +96605x)
// ويحوّلها لصيغة موحدة 966XXXXXXXXX تُستخدم كمفتاح مطابقة في join_loyalty_member
// (الدالة تقارن phone بمساواة نصية تامة — بدون تطبيع تُنشأ عضوية مكررة لكل صيغة).
export function normalizeSaudiPhone(input: string): string | null {
  const digits = input.trim().replace(/[\s-]/g, "").replace(/^\+/, "");

  let local = digits.startsWith("966") ? digits.slice(3) : digits;
  if (local.startsWith("0")) local = local.slice(1);

  if (!/^5\d{8}$/.test(local)) return null;

  return `966${local}`;
}
