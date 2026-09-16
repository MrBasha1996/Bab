import { z } from "zod";

export const branchSchema = z.object({
  nameAr: z.string().min(2, "common.nameTooShort").max(120, "common.nameTooLong"),
  nameEn: z.string().min(2, "common.nameTooShort").max(120, "common.nameTooLong"),
  addressAr: z.string().max(300, "common.descriptionTooLong").optional().or(z.literal("")),
  addressEn: z.string().max(300, "common.descriptionTooLong").optional().or(z.literal("")),
  phone: z.string().max(20, "common.nameTooLong").optional().or(z.literal("")),
  googleReviewsUrl: z.string().url("common.invalidData").max(500, "common.nameTooLong").optional().or(z.literal("")),
  googleMapsUrl: z.string().url("common.invalidData").max(500, "common.nameTooLong").optional().or(z.literal("")),
  timezone: z.string().min(1, "common.required"),
});

export type BranchInput = z.infer<typeof branchSchema>;
