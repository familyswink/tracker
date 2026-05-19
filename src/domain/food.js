/** @module domain/food — session vs daily food quantities */

import { getEffectiveLogDt, isoToLocalYMD, now, wks } from '../core/date.js';

/**
 * @param {{ fl?: Array<{fid:string,dt:string,la?:string,qty:number}>, flSave?: string|null, gdt?: string|null }} state
 */
export function gDFQ(state, fid) {
  const logDay = isoToLocalYMD(getEffectiveLogDt(state));
  return (state.fl || [])
    .filter((e) => String(e.fid) === String(fid) && isoToLocalYMD(e.dt) === logDay)
    .reduce((s, e) => s + e.qty, 0);
}

/**
 * Session quantity since flSave (resets after global Save / Load Meal).
 */
export function gTFQ(state, fid) {
  const logDay = isoToLocalYMD(getEffectiveLogDt(state));
  const fs = state.flSave;
  return (state.fl || [])
    .filter(
      (e) =>
        String(e.fid) === String(fid) &&
        isoToLocalYMD(e.dt) === logDay &&
        (!fs || new Date(e.la) >= new Date(fs))
    )
    .reduce((s, e) => s + e.qty, 0);
}

export function gWFQ(state, fid) {
  const ws = wks();
  return (state.fl || [])
    .filter((e) => e.fid === fid && isoToLocalYMD(e.dt) >= ws)
    .reduce((s, e) => s + e.qty, 0);
}

export function bumpFlSave(state, ts) {
  const t = ts || now();
  state.flSave = new Date(new Date(t).getTime() + 1).toISOString();
}
