import { z } from "zod";

export const loyaltySettingsSchema = z.object({
  pointsPerCurrencyUnit: z.number().positive("common.amountPositive"),
});

export type LoyaltySettingsInput = z.infer<typeof loyaltySettingsSchema>;

export const loyaltyTierSchema = z.object({
  nameAr: z.string().min(2, "common.nameTooShort").max(60, "common.nameTooLong"),
  nameEn: z.string().min(2, "common.nameTooShort").max(60, "common.nameTooLong"),
  minPoints: z.number().int().min(0, "common.invalidValue"),
});

export type LoyaltyTierInput = z.infer<typeof loyaltyTierSchema>;

export const loyaltyRewardSchema = z.object({
  nameAr: z.string().min(2, "common.nameTooShort").max(80, "common.nameTooLong"),
  nameEn: z.string().min(2, "common.nameTooShort").max(80, "common.nameTooLong"),
  pointsCost: z.number().int().positive("common.amountPositive"),
  isActive: z.boolean(),
});

export type LoyaltyRewardInput = z.infer<typeof loyaltyRewardSchema>;

export const loyaltyRedemptionStatusSchema = z.object({
  status: z.enum(["pending", "fulfilled", "cancelled"]),
});

export type LoyaltyRedemptionStatusInput = z.infer<typeof loyaltyRedemptionStatusSchema>;
