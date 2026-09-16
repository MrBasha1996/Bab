// منطق تحديد المنيو النشط الآن حسب جدولة menu_schedules وتوقيت الفرع (IANA
// timezone، مثال Asia/Riyadh). لا اعتماد على توقيت السيرفر — يُحسب اليوم/الوقت
// دائماً بمنطقة الفرع عبر Intl.DateTimeFormat.

export interface MenuScheduleRow {
  dayOfWeek: number; // 0=الأحد .. 6=السبت
  startTime: string; // "HH:MM" أو "HH:MM:SS"
  endTime: string;
}

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// اليوم (0=الأحد..6=السبت) والدقائق منذ منتصف الليل، بتوقيت المنطقة المحددة،
// بلا اعتماد على توقيت بيئة التشغيل.
export function zonedDayAndMinutes(date: Date, timeZone: string): { dayOfWeek: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const weekdayShort = parts.find((p) => p.type === "weekday")!.value;
  const hour = Number(parts.find((p) => p.type === "hour")!.value);
  const minute = Number(parts.find((p) => p.type === "minute")!.value);

  const weekdayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return { dayOfWeek: weekdayIndex[weekdayShort], minutes: hour * 60 + minute };
}

// هل تقع دقيقة معينة (currentDay/currentMinutes) ضمن صف جدولة واحد، مع دعم
// الفترات العابرة لمنتصف الليل (end_time < start_time يعني أنها تمتد لليوم التالي).
function matchesSchedule(row: MenuScheduleRow, currentDay: number, currentMinutes: number): boolean {
  const start = parseTimeToMinutes(row.startTime);
  const end = parseTimeToMinutes(row.endTime);

  if (start <= end) {
    return row.dayOfWeek === currentDay && currentMinutes >= start && currentMinutes < end;
  }

  // فترة عابرة لمنتصف الليل: الجزء الأول من يوم row.dayOfWeek حتى منتصف الليل،
  // والجزء الثاني من منتصف الليل حتى end_time في اليوم التالي.
  const isFirstHalf = row.dayOfWeek === currentDay && currentMinutes >= start;
  const nextDay = (row.dayOfWeek + 1) % 7;
  const isSecondHalf = currentDay === nextDay && currentMinutes < end;
  return isFirstHalf || isSecondHalf;
}

// بلا أي صف جدولة إطلاقاً: القائمة نشطة دائماً.
export function isMenuActiveNow(schedules: MenuScheduleRow[], timeZone: string, now: Date = new Date()): boolean {
  if (schedules.length === 0) return true;

  const { dayOfWeek, minutes } = zonedDayAndMinutes(now, timeZone);
  return schedules.some((row) => matchesSchedule(row, dayOfWeek, minutes));
}
