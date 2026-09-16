import { z } from "zod";
import { preorderItemSchema } from "@/lib/validation/preorder.schema";

export const reservationSchema = z.object({
  branchId: z.string().uuid(),
  tableId: z.union([z.string().uuid(), z.literal("")]),
  customerName: z.string().min(1, "common.nameTooShort").max(100, "common.nameTooLong"),
  customerPhone: z.string().min(5, "common.nameTooShort").max(20, "common.nameTooLong"),
  partySize: z.number().int().min(1),
  reservationTime: z.string().min(1, "common.nameTooShort"),
  source: z.enum(["website", "phone", "walk_in"]),
  notes: z.string().max(500).optional(),
  preorderItems: z.array(preorderItemSchema),
});

export type ReservationInput = z.infer<typeof reservationSchema>;

export const reservationStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

export type ReservationStatusInput = z.infer<typeof reservationStatusSchema>;
