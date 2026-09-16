import { z } from "zod";

export const tableSchema = z.object({
  branchId: z.string().uuid(),
  labelAr: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
  labelEn: z.string().min(1, "common.nameTooShort").max(60, "common.nameTooLong"),
});

export type TableInput = z.infer<typeof tableSchema>;
