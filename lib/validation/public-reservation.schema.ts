import { z } from "zod";

export const publicReservationSchema = z.object({
  branchId: z.string().uuid(),
  customerName: z.string().min(1, "common.nameTooShort").max(100, "common.nameTooLong"),
  customerPhone: z.string().min(5, "common.nameTooShort").max(20, "common.nameTooLong"),
  partySize: z.number().int().min(1),
  reservationTime: z.string().min(1, "common.nameTooShort"),
  notes: z.string().max(500).optional(),
});

export type PublicReservationInput = z.infer<typeof publicReservationSchema>;
