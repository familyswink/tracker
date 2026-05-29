/**
 * Daily log export: normalized field keys (field_unit), tab-aware sections.
 */

import { formatFieldDefaultValue, isColonStepField } from './activity-field.js';
import { isTabVisible } from './tabs.js';

const UNIT_SUFFIX = {
  minutes: 'min',
  minute: 'min',
  mins: 'min',
  min: 'min',
  hours: 'hr',
  hour: 'hr',
  hr: 'hr',
  h: 'hr',
  seconds: 'sec',
  second: 'sec',
  sec: 'sec',
  s: 'sec',
  f: 'f',
  '°f': 'f',
  fahrenheit: 'f',
  c: 'c',
  '°c': 'c',
  celsius: 'c',
  oz: 'oz',
  ounces: 'oz',
  ml: 'ml',
  g: 'g',
  mg: 'mg',
};

/** Manage field name + unit → export key e.g. duration_min, temperature_f */
export function exportFieldKey(f) {
  const base = String(f?.nm || 'field')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  const u = String(f?.u || '')
    .trim()
    .toLowerCase();
  const suf = UNIT_SUFFIX[u] || (u ? u.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') : '');
  return suf ? `${base}_${suf}` : base;
}

function slugKey(nm) {
  return String(nm || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function fieldValueFromFlds(flds, ff) {
  if (!flds || !ff?.nm) return undefined;
  const nm = ff.nm;
  if (flds[nm] !== undefined && flds[nm] !== null && flds[nm] !== '') return flds[nm];
  const slug = slugKey(nm);
  for (const k of Object.keys(flds)) {
    if (slugKey(k) === slug) return flds[k];
  }
  return undefined;
}

export function exportValueForField(ff, raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (isColonStepField(ff)) {
    if (typeof raw === 'string' && raw.includes(':')) return raw;
    const formatted = formatFieldDefaultValue(ff, raw);
    return formatted !== undefined ? formatted : raw;
  }
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}

/** Flat normalized keys for one activity log row (no nested `fields`). */
export function normalizeActivityExport(flds, act) {
  const out = {};
  if (!act?.flds?.length || !flds) return out;
  for (const ff of act.flds) {
    if (ff.t === 'opts') {
      const v = fieldValueFromFlds(flds, ff);
      if (v === undefined || v === null || v === '') continue;
      const key = slugKey(ff.nm) || 'activity';
      out[key] = ff.multi && Array.isArray(v) ? v.map(String) : v;
      continue;
    }
    if (ff.t === 'number') {
      const raw = fieldValueFromFlds(flds, ff);
      const ev = exportValueForField(ff, raw);
      if (ev === undefined) continue;
      out[exportFieldKey(ff)] = ev;
      continue;
    }
    if (ff.t === 'yesno' || ff.t === 'text') {
      const raw = fieldValueFromFlds(flds, ff);
      if (raw === undefined || raw === null || String(raw) === '') continue;
      out[slugKey(ff.nm)] = raw;
    }
  }
  return out;
}

export function tabVisibleForExport(tabs, id) {
  return isTabVisible(tabs, id);
}

/** Drop null-only branches from payload before JSON fence. */
export function pruneExportPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const out = { ...payload };
  if (out.gastrointestinal_tracking) {
    const g = out.gastrointestinal_tracking;
    if (!g.events?.length && !g.urgent_or_watery_present) {
      delete out.gastrointestinal_tracking;
    } else if (g.highest_bristol_type == null) {
      const { highest_bristol_type, ...rest } = g;
      out.gastrointestinal_tracking = rest;
    }
  }
  for (const k of ['water_logged', 'food_logged', 'food_categories_served', 'meals_executed', 'supplements_logged', 'supplement_notes', 'lifestyle_protocols']) {
    if (Array.isArray(out[k]) && out[k].length === 0) delete out[k];
  }
  if (out.total_water_intake_oz === 0) delete out.total_water_intake_oz;
  return out;
}
