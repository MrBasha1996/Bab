import { z } from "zod";

export const categorySchema = z.object({
  menuId: z.string().uuid(),
  branchId: z.string().uuid(),
  nameAr: z.string().min(1, "common.nameTooShort").max(80, "common.nameTooLong"),
  nameEn: z.string().min(1, "common.nameTooShort").max(80, "common.nameTooLong"),
  sortOrder: z.number().int(),
});

export type CategoryInput = z.infer<typeof categorySchema>;
