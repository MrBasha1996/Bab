import { z } from "zod";

export const optionValueSchema = z.object({
  id: z.string().uuid().optional(),
  nameAr: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
  nameEn: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
  priceDelta: z.number(),
});

export type OptionValueInput = z.infer<typeof optionValueSchema>;

// ملاحظة: min_select<=max_select يُتحقق منه عبر superRefine في itemSchema
// (وليس .refine() هنا) — تغليف عنصر مصفوفة بـ ZodEffects يكسر استنتاج أنواع
// zodResolver مع react-hook-form (تعارض أنواع Resolver غامض عند البناء).
export const optionGroupSchema = z.object({
  id: z.string().uuid().optional(),
  nameAr: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
  nameEn: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
  isRequired: z.boolean(),
  minSelect: z.number().int().min(0),
  maxSelect: z.number().int().min(1),
  values: z.array(optionValueSchema).min(1, "menus.item.optionGroupNeedsValue"),
});

export type OptionGroupInput = z.infer<typeof optionGroupSchema>;
