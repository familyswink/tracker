/**
 * Calendar period exports (month / quarter / year combined daily logs).
 */

import { localDateYMD } from '../core/date.js';

export const MONTH_EXPORT_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function calendarMonthKey(y, m) {
  return `${y}-${String(m).padStart(2, '0')}`;
}

export function quarterNumber(month1) {
  return Math.floor((month1 - 1) / 3) + 1;
}

export function datesInCalendarMonth(y, m) {
  const out = [];
  const dt = new Date(y, m - 1, 1);
  while (dt.getMonth() === m - 1) {
    out.push(localDateYMD(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return out;
}

export function datesInQuarter(y, q) {
  const startMonth = (q - 1) * 3 + 1;
  return [0, 1, 2].flatMap((i) => datesInCalendarMonth(y, startMonth + i));
}

export function datesInYear(y) {
  const out = [];
  for (let m = 1; m <= 12; m++) out.push(...datesInCalendarMonth(y, m));
  return out;
}

/** True when save day crossed month, quarter, or year vs previous save. */
export function shouldCheckPeriodExports(prevSaveYmd, saveYmd) {
  if (!saveYmd) return false;
  if (!prevSaveYmd) return true;
  if (saveYmd.slice(0, 7) !== prevSaveYmd.slice(0, 7)) return true;
  const [y, mo] = saveYmd.split('-').map(Number);
  const [py, pm] = prevSaveYmd.split('-').map(Number);
  if (quarterNumber(mo) !== quarterNumber(pm) || y !== py) return true;
  if (saveYmd.slice(0, 4) !== prevSaveYmd.slice(0, 4)) return true;
  return false;
}

/**
 * Export jobs for periods completed before saveYmd (first save in new month/quarter/year).
 * @param {string} saveYmd
 * @param {{ months?: string[], quarters?: string[], years?: string[] }} done
 */
export function periodBoundaryExports(saveYmd, done = {}) {
  const [y, mo] = saveYmd.split('-').map(Number);
  const doneMonths = new Set(done.months || []);
  const doneQuarters = new Set(done.quarters || []);
  const doneYears = new Set(done.years || []);
  const out = [];

  const prevM = mo === 1 ? { y: y - 1, m: 12 } : { y, m: mo - 1 };
  const mKey = calendarMonthKey(prevM.y, prevM.m);
  if (!doneMonths.has(mKey)) {
    out.push({
      kind: 'month',
      key: mKey,
      filename: `${prevM.y}_${MONTH_EXPORT_NAMES[prevM.m - 1]}.md`,
      dates: datesInCalendarMonth(prevM.y, prevM.m),
    });
  }

  if ([1, 4, 7, 10].includes(mo)) {
    const prevQ = mo === 1 ? 4 : quarterNumber(mo) - 1;
    const prevQY = mo === 1 ? y - 1 : y;
    const qKey = `${prevQY}-Q${prevQ}`;
    if (!doneQuarters.has(qKey)) {
      out.push({
        kind: 'quarter',
        key: qKey,
        filename: `${prevQY}_Q${prevQ}.md`,
        dates: datesInQuarter(prevQY, prevQ),
      });
    }
  }

  if (mo === 1) {
    const prevY = y - 1;
    const yKey = String(prevY);
    if (!doneYears.has(yKey)) {
      out.push({
        kind: 'year',
        key: yKey,
        filename: `${prevY}.md`,
        dates: datesInYear(prevY),
      });
    }
  }

  return out;
}
