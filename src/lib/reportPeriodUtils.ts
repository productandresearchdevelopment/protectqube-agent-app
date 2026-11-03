/**
 * Helper utility for dynamic report timeframe, active month, and timeline calculations.
 */

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/**
 * Returns the default active month date range string (e.g. "01 Nov 2026 - 30 Nov 2026").
 */
export function getCurrentMonthPeriodStr(referenceDate: Date = new Date()): string {
  const year = referenceDate.getFullYear();
  const monthIdx = referenceDate.getMonth();
  const monthName = MONTH_NAMES[monthIdx];
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const lastDayStr = lastDay < 10 ? `0${lastDay}` : `${lastDay}`;
  return `01 ${monthName} ${year} - ${lastDayStr} ${monthName} ${year}`;
}

export interface ReportPeriodInfo {
  monthStr: string;
  yearStr: string;
  daysInMonth: number;
  effectiveDays: number;
  todayDay: number | null;
  isCurrentMonth: boolean;
  periodLabel: string;
  effectivePeriodStr: string;
}

/**
 * Parses a report period string (e.g. "01 Nov 2026 - 30 Nov 2026") into structured details.
 * If viewing current month, effectiveDays is capped to today's date (future dates are omitted).
 * effectivePeriodStr dynamically displays from start date up to today's date for current month.
 * Falls back to current system date if not provided or unparsable.
 */
export function parseReportPeriod(periodStr?: string, referenceDate: Date = new Date()): ReportPeriodInfo {
  const now = referenceDate;
  let monthStr = MONTH_NAMES[now.getMonth()];
  let yearNum = now.getFullYear();
  let daysInMonth = new Date(yearNum, now.getMonth() + 1, 0).getDate();
  let startDayStr = "01";

  if (periodStr) {
    const rangeParts = periodStr.split(" - ");
    if (rangeParts.length >= 1) {
      const startMatch = rangeParts[0].match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
      if (startMatch) {
        const d = parseInt(startMatch[1], 10);
        startDayStr = d < 10 ? `0${d}` : `${d}`;
      }
    }

    const match = periodStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
    if (match) {
      monthStr = match[2];
      yearNum = parseInt(match[3], 10);
      const mIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === monthStr.toLowerCase()
      );
      if (mIdx !== -1) {
        monthStr = MONTH_NAMES[mIdx];
        daysInMonth = new Date(yearNum, mIdx + 1, 0).getDate();
      }
    }
  }

  const targetMonthIdx = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === monthStr.toLowerCase()
  );
  const isCurrentMonth =
    now.getFullYear() === yearNum && now.getMonth() === targetMonthIdx;
  const todayDay = isCurrentMonth ? now.getDate() : null;

  // Tanggal selanjutnya yang belum terjadi dihilangkan jika bulan berjalan
  const effectiveDays = isCurrentMonth && todayDay ? Math.min(todayDay, daysInMonth) : daysInMonth;

  const todayDayStr = todayDay ? (todayDay < 10 ? `0${todayDay}` : `${todayDay}`) : (daysInMonth < 10 ? `0${daysInMonth}` : `${daysInMonth}`);
  const effectivePeriodStr = isCurrentMonth && todayDay
    ? `${startDayStr} ${monthStr} ${yearNum} - ${todayDayStr} ${monthStr} ${yearNum}`
    : (periodStr || `${startDayStr} ${monthStr} ${yearNum} - ${daysInMonth} ${monthStr} ${yearNum}`);

  return {
    monthStr,
    yearStr: String(yearNum),
    daysInMonth,
    effectiveDays,
    todayDay,
    isCurrentMonth,
    periodLabel: periodStr || `${monthStr} ${yearNum}`,
    effectivePeriodStr,
  };
}

