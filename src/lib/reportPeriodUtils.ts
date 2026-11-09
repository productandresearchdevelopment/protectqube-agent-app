/**
 * Helper utility for dynamic report timeframe, active month, and timeline calculations.
 */

export const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Formats a Date object into 'DD MMM YYYY' (e.g. '01 Nov 2026').
 */
export function formatDateToDisplay(d: Date): string {
  const day = d.getDate();
  const dayStr = day < 10 ? `0${day}` : `${day}`;
  const monthStr = MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${dayStr} ${monthStr} ${year}`;
}

/**
 * Formats a Date object into 'YYYY-MM-DD' for HTML date inputs.
 */
export function formatDateToInput(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * Converts a display string ('01 Nov 2026') to input string ('2026-11-01').
 */
export function parseDisplayToInput(disp?: string): string {
  if (!disp) return "";
  const m = disp.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!m) {
    const isoM = disp.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoM) return disp.trim();
    return "";
  }
  const d = String(parseInt(m[1], 10)).padStart(2, "0");
  const mIdx = MONTH_NAMES.findIndex(
    (x) => x.toLowerCase() === m[2].toLowerCase(),
  );
  if (mIdx === -1) return "";
  const month = String(mIdx + 1).padStart(2, "0");
  const year = m[3];
  return `${year}-${month}-${d}`;
}

/**
 * Converts an input string ('2026-11-04') to display string ('04 Nov 2026').
 */
export function parseInputToDisplay(inp?: string): string {
  if (!inp) return "";
  const parts = inp.split("-");
  if (parts.length !== 3) return inp;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  const dayStr = d < 10 ? `0${d}` : `${d}`;
  return `${dayStr} ${MONTH_NAMES[m] || "Nov"} ${y}`;
}

/**
 * Returns the default active month date range string from 1st of current month up to today (e.g. "01 Nov 2026 - 05 Nov 2026").
 */
export function getCurrentMonthPeriodStr(
  referenceDate: Date = new Date(),
): string {
  const year = referenceDate.getFullYear();
  const monthIdx = referenceDate.getMonth();
  const monthName = MONTH_NAMES[monthIdx];
  const today = referenceDate.getDate();
  const todayStr = today < 10 ? `0${today}` : `${today}`;
  return `01 ${monthName} ${year} - ${todayStr} ${monthName} ${year}`;
}

/**
 * Returns the full calendar month date range string (e.g. "01 Nov 2026 - 30 Nov 2026").
 */
export function getFullMonthPeriodStr(
  referenceDate: Date = new Date(),
): string {
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
  yearNum: number;
  daysInMonth: number;
  startDay: number;
  endDay: number;
  effectiveDays: number;
  todayDay: number | null;
  isCurrentMonth: boolean;
  periodLabel: string;
  effectivePeriodStr: string;
}

/**
 * Parses a report period string (e.g. "01 Nov 2026 - 30 Nov 2026" or "01 Nov 2026 - 04 Nov 2026") into structured details.
 * If viewing current month, effectiveDays is capped to today's date (future dates are omitted).
 * effectivePeriodStr dynamically displays from start date up to end date/today's date for current month.
 * Falls back to current system date if not provided or unparsable.
 */
export function parseReportPeriod(
  periodStr?: string,
  referenceDate: Date = new Date(),
): ReportPeriodInfo {
  const now = referenceDate;
  let monthStr = MONTH_NAMES[now.getMonth()];
  let yearNum = now.getFullYear();
  let daysInMonth = new Date(yearNum, now.getMonth() + 1, 0).getDate();
  let startDay = 1;
  let endDay = daysInMonth;
  let startDayStr = "01";
  let hasExplicitEnd = false;

  if (periodStr) {
    const rangeParts = periodStr.split(" - ");
    if (rangeParts.length >= 1) {
      const startMatch = rangeParts[0].match(
        /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/,
      );
      if (startMatch) {
        startDay = parseInt(startMatch[1], 10);
        startDayStr = startDay < 10 ? `0${startDay}` : `${startDay}`;
      } else {
        const isoMatch1 = rangeParts[0].match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch1) {
          startDay = parseInt(isoMatch1[3], 10);
          startDayStr = startDay < 10 ? `0${startDay}` : `${startDay}`;
        }
      }
    }
    if (rangeParts.length >= 2) {
      const endMatch = rangeParts[1].match(
        /(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/,
      );
      if (endMatch) {
        endDay = parseInt(endMatch[1], 10);
        hasExplicitEnd = true;
      } else {
        const isoMatch2 = rangeParts[1].match(/(\d{4})-(\d{2})-(\d{2})/);
        if (isoMatch2) {
          endDay = parseInt(isoMatch2[3], 10);
          hasExplicitEnd = true;
        }
      }
    }

    const match = periodStr.match(/(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
    if (match) {
      monthStr = match[2];
      yearNum = parseInt(match[3], 10);
      const mIdx = MONTH_NAMES.findIndex(
        (m) => m.toLowerCase() === monthStr.toLowerCase(),
      );
      if (mIdx !== -1) {
        monthStr = MONTH_NAMES[mIdx];
        daysInMonth = new Date(yearNum, mIdx + 1, 0).getDate();
      }
    }
  }

  const targetMonthIdx = MONTH_NAMES.findIndex(
    (m) => m.toLowerCase() === monthStr.toLowerCase(),
  );
  const isCurrentMonth =
    now.getFullYear() === yearNum && now.getMonth() === targetMonthIdx;
  const todayDay = isCurrentMonth ? now.getDate() : null;

  // Tanggal selanjutnya yang belum terjadi dihilangkan jika bulan berjalan
  let effectiveDays = daysInMonth;
  if (isCurrentMonth && todayDay) {
    effectiveDays = hasExplicitEnd ? Math.min(todayDay, endDay) : todayDay;
  } else if (hasExplicitEnd) {
    effectiveDays = endDay;
  }

  const actualEndDay = hasExplicitEnd ? endDay : (isCurrentMonth && todayDay ? todayDay : daysInMonth);
  const actualEndDayStr = actualEndDay < 10 ? `0${actualEndDay}` : `${actualEndDay}`;

  const effectivePeriodStr =
    hasExplicitEnd && periodStr
      ? periodStr
      : `${startDayStr} ${monthStr} ${yearNum} - ${actualEndDayStr} ${monthStr} ${yearNum}`;

  return {
    monthStr,
    yearStr: String(yearNum),
    yearNum,
    daysInMonth,
    startDay,
    endDay: actualEndDay,
    effectiveDays,
    todayDay,
    isCurrentMonth,
    periodLabel: periodStr || `${monthStr} ${yearNum}`,
    effectivePeriodStr,
  };
}
