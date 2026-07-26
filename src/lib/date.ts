const pad = (n: number): string => String(n).padStart(2, "0");

export const formatDateOnly = (date: Date | string): string => {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const getUTCDayOfWeek = (year: number, month: number, day: number): number => {
  return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
};

export const isWeekend = (year: number, month: number, day: number, weekendDays: number[] = [0, 6]): boolean => {
  const dayOfWeek = getUTCDayOfWeek(year, month, day);
  return weekendDays.includes(dayOfWeek);
};

export const buildDateStr = (year: number, month: number, day: number): string => {
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const calculateWorkingDays = (fromDateStr: string, toDateStr: string, weekendDays: number[] = [0, 6]): number => {
  if (!fromDateStr || !toDateStr) return 0;
  const start = new Date(`${fromDateStr}T00:00:00.000Z`);
  const end = new Date(`${toDateStr}T00:00:00.000Z`);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  let count = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const dayOfWeek = cursor.getUTCDay();
    if (weekendDays.includes(dayOfWeek)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      continue;
    }
    count++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return count;
};

export const toISTTime = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    hour12: false,
  });
};

export const getMonthBoundaries = (year: number, month: number): { start: string; end: string } => {
  const start = `${year}-${pad(month)}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { start, end };
};

export const getCurrentYearMonth = (): { year: number; month: number } => {
  const { year, month } = getTodayIST();
  return { year, month };
};

export const getTodayIST = (): { year: number; month: number; day: number } => {
  const [year, month, day] = new Date()
    .toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
    .split("-")
    .map(Number);
  return { year, month, day };
};

export const parseDateParts = (date: Date | string): { year: number; month: number; day: number } => {
  const d = new Date(date);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};

export const buildWeekendDays = (settings: { saturdayIsHoliday?: boolean; sundayIsHoliday?: boolean } | null): number[] => {
  const weekendDays: number[] = [];
  if (settings?.saturdayIsHoliday !== false) weekendDays.push(6);
  if (settings?.sundayIsHoliday !== false) weekendDays.push(0);
  return weekendDays;
};
