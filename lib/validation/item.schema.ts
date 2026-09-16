import { z } from "zod";
import { optionGroupSchema } from "@/lib/validation/option-group.schema";

export const itemVariantSchema = z.object({
  id: z.string().uuid().optional(),
  nameAr: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
  nameEn: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
  price: z.number().min(0),
});

export type ItemVariantInput = z.infer<typeof itemVariantSchema>;

export const itemSchema = z
  .object({
    branchId: z.string().uuid(),
    nameAr: z.string().min(1, "common.nameTooShort").max(120, "common.nameTooLong"),
    nameEn: z.string().min(1, "common.nameTooShort").max(120, "common.nameTooLong"),
    descriptionAr: z.string().max(1000).optional().or(z.literal("")),
    descriptionEn: z.string().max(1000).optional().or(z.literal("")),
    price: z.number().min(0),
    calories: z.number().int().min(0).optional(),
    isSplittable: z.boolean(),
    categoryIds: z.array(z.string().uuid()).min(1, "menus.item.needsCategory"),
    allergenIds: z.array(z.string().uuid()),
    variants: z.array(itemVariantSchema),
    optionGroups: z.array(optionGroupSchema),
  })
  .superRefine((data, ctx) => {
    data.optionGroups.forEach((group, i) => {
      if (group.maxSelect < group.minSelect) {
        ctx.addIssue({
          code: "custom",
          message: "menus.item.optionGroupRangeInvalid",
          path: ["optionGroups", i, "maxSelect"],
        });
      }
    });
  });

export type ItemInput = z.infer<typeof itemSchema>;
