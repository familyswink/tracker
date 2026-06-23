/**
 * Supplement history bulk actions (Change / Add).
 */

import { isoToLocalYMD, onLogDay } from '../core/date.js';
import { datesInRangeInclusive } from './change-report.js';

export function slEntryMid(state, entry) {
  if (!entry || entry.sid === undefined) return null;
  const sc = (state.sch || []).find((x) => x.id === entry.sid);
  return sc?.mid || null;
}

export function isSuppDoseLog(entry) {
  return !!(entry && entry.sid !== undefined);
}

/** Selected dose logs must share one catalog mid. */
export function validateBulkChangeSelection(state, entries) {
  const doses = entries.filter(isSuppDoseLog);
  if (!doses.length) return { ok: false, error: 'Select supplement dose entries only (not notes).' };
  const mids = new Set(doses.map((e) => slEntryMid(state, e)).filter(Boolean));
  if (mids.size !== 1) return { ok: false, error: 'Select entries for one supplement only.' };
  return { ok: true, mid: [...mids][0], entries: doses };
}

/**
 * Reference supplement must have exactly one dose log per calendar day in range.
 * @returns {{ ok: true, templateLogs: object[] } | { ok: false, error: string }}
 */
export function validateTemplateOnePerDay(state, refMid, startYmd, endYmd, isWaterMid) {
  if (!refMid) return { ok: false, error: 'Pick a reference supplement.' };
  const days = datesInRangeInclusive(startYmd, endYmd);
  if (!days.length) return { ok: false, error: 'Pick a valid date range.' };

  const templateLogs = [];
  for (const day of days) {
    const dayLogs = (state.sl || []).filter((e) => {
      if (!onLogDay(e.dt, day)) return false;
      if (slEntryMid(state, e) !== refMid) return false;
      if (isWaterMid && isWaterMid(refMid)) return false;
      return true;
    });
    if (dayLogs.length !== 1) {
      return {
        ok: false,
        error: `Reference must have exactly 1 log per day (${day}: found ${dayLogs.length}).`,
      };
    }
    templateLogs.push(dayLogs[0]);
  }
  return { ok: true, templateLogs };
}
