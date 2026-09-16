import { z } from "zod";

export const publicEventReservationSchema = z.object({
  branchId: z.string().uuid(),
  reservationType: z.enum(["event", "corporate"]),
  companyName: z.string().max(150).optional(),
  contactName: z.string().min(1, "common.nameTooShort").max(100, "common.nameTooLong"),
  contactPhone: z.string().min(5, "common.nameTooShort").max(20, "common.nameTooLong"),
  guestCount: z.number().int().min(1),
  eventDate: z.string().min(1, "common.nameTooShort"),
  notes: z.string().max(500).optional(),
});

export type PublicEventReservationInput = z.infer<typeof publicEventReservationSchema>;
