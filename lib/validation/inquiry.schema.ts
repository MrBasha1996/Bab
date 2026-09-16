import { z } from "zod";

export const inquirySchema = z.object({
  branchId: z.string().uuid(),
  name: z.string().min(1, "common.nameTooShort").max(100, "common.nameTooLong"),
  phone: z.string().min(5, "common.nameTooShort").max(20, "common.nameTooLong"),
  email: z.string().email("common.invalidData").max(150).optional().or(z.literal("")),
  subject: z.string().max(150).optional(),
  message: z.string().min(1, "common.nameTooShort").max(1000, "common.descriptionTooLong"),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const inquiryStatusSchema = z.object({
  status: z.enum(["new", "read", "resolved"]),
});

export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;
