import { z } from "zod";

export const menuSchema = z.object({
  branchId: z.string().uuid(),
  nameAr: z.string().min(1, "common.nameTooShort").max(80, "common.nameTooLong"),
  nameEn: z.string().min(1, "common.nameTooShort").max(80, "common.nameTooLong"),
});

export type MenuInput = z.infer<typeof menuSchema>;

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export const menuScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_RE, "menus.schedule.invalidTime"),
  endTime: z.string().regex(TIME_RE, "menus.schedule.invalidTime"),
});

export type MenuScheduleInput = z.infer<typeof menuScheduleSchema>;
