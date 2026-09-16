import { z } from "zod";

export const preorderItemSchema = z.object({
  menuItemId: z.string().uuid(),
  itemVariantId: z.union([z.string().uuid(), z.literal("")]),
  secondMenuItemId: z.union([z.string().uuid(), z.literal("")]),
  secondItemVariantId: z.union([z.string().uuid(), z.literal("")]),
  quantity: z.number().int().min(1),
  notes: z.string().max(200).optional(),
});

export const preorderItemsSchema = z.array(preorderItemSchema);

export type PreorderItemInput = z.infer<typeof preorderItemSchema>;
