import { z } from "zod";

export const complaintSchema = z.object({
  branchId: z.string().uuid(),
  tableId: z.string().uuid(),
  type: z.enum(["complaint", "suggestion"]),
  message: z.string().min(1, "common.nameTooShort").max(1000, "common.descriptionTooLong"),
  customerName: z.string().max(100, "common.nameTooLong").optional().or(z.literal("")),
  customerPhone: z.string().max(20, "common.nameTooLong").optional().or(z.literal("")),
});

export type ComplaintInput = z.infer<typeof complaintSchema>;
