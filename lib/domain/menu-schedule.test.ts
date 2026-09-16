import { describe, expect, it } from "vitest";
import { isMenuActiveNow, zonedDayAndMinutes, type MenuScheduleRow } from "./menu-schedule";

const TZ = "Asia/Riyadh";

describe("zonedDayAndMinutes", () => {
  it("يحسب اليوم والدقائق بتوقيت المنطقة المحددة", () => {
    // 2026-09-15T11:30:00Z = الثلاثاء 14:30 بتوقيت الرياض (UTC+3)
    const { dayOfWeek, minutes } = zonedDayAndMinutes(new Date("2026-09-15T11:30:00Z"), TZ);
    expect(dayOfWeek).toBe(2); // الثلاثاء
    expect(minutes).toBe(14 * 60 + 30);
  });
});

describe("isMenuActiveNow", () => {
  it("بلا أي جدولة: نشطة دائماً", () => {
    expect(isMenuActiveNow([], TZ, new Date("2026-09-15T11:30:00Z"))).toBe(true);
  });

  it("فترة عادية داخل نفس اليوم: نشطة ضمن النطاق ومغلقة خارجه", () => {
    const schedules: MenuScheduleRow[] = [{ dayOfWeek: 2, startTime: "12:00", endTime: "16:00" }];
    // 14:30 الثلاثاء بالرياض → داخل النطاق
    expect(isMenuActiveNow(schedules, TZ, new Date("2026-09-15T11:30:00Z"))).toBe(true);
    // 17:00 الثلاثاء بالرياض → خارج النطاق
    expect(isMenuActiveNow(schedules, TZ, new Date("2026-09-15T14:00:00Z"))).toBe(false);
    // 10:00 الأربعاء بالرياض → يوم مختلف
    expect(isMenuActiveNow(schedules, TZ, new Date("2026-09-16T07:00:00Z"))).toBe(false);
  });

  it("فترة عابرة لمنتصف الليل: نشطة في الجزأين قبل وبعد منتصف الليل", () => {
    // فترة السهرة: الثلاثاء 22:00 → الأربعاء 02:00
    const schedules: MenuScheduleRow[] = [{ dayOfWeek: 2, startTime: "22:00", endTime: "02:00" }];

    // الثلاثاء 23:00 بالرياض → نشطة (الجزء الأول)
    expect(isMenuActiveNow(schedules, TZ, new Date("2026-09-15T20:00:00Z"))).toBe(true);
    // الأربعاء 01:00 بالرياض → نشطة (الجزء الثاني، اليوم التالي)
    expect(isMenuActiveNow(schedules, TZ, new Date("2026-09-15T22:00:00Z"))).toBe(true);
    // الأربعاء 03:00 بالرياض → مغلقة (بعد نهاية الفترة العابرة)
    expect(isMenuActiveNow(schedules, TZ, new Date("2026-09-16T00:00:00Z"))).toBe(false);
    // الثلاثاء 20:00 بالرياض → مغلقة (قبل بداية الفترة)
    expect(isMenuActiveNow(schedules, TZ, new Date("2026-09-15T16:00:00Z"))).toBe(false);
  });
});
