import { z } from "zod";

export const restaurantSchema = z.object({
  nameAr: z.string().min(2, "common.nameTooShort").max(120, "common.nameTooLong"),
  nameEn: z.string().min(2, "common.nameTooShort").max(120, "common.nameTooLong"),
  aboutAr: z.string().max(2000, "common.descriptionTooLong").optional().or(z.literal("")),
  aboutEn: z.string().max(2000, "common.descriptionTooLong").optional().or(z.literal("")),
});

export type RestaurantInput = z.infer<typeof restaurantSchema>;
