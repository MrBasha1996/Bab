import { z } from "zod";

export const ratingSchema = z.object({
  branchId: z.string().uuid(),
  tableId: z.string().uuid(),
  stars: z.number().int().min(1, "common.required").max(5),
  comment: z.string().max(1000, "common.descriptionTooLong").optional().or(z.literal("")),
});

export type RatingInput = z.infer<typeof ratingSchema>;
