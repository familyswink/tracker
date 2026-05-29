/* Daily Tracker — journal + domain (dual-writer, Phase 2) */
(function (global) {
'use strict';
/**
 * Tracker-head fenced `yaml journal` (`daily-log-requirements-v2` §3).
 * Deterministic YAML blocks — browser-safe, zero npm deps.
 */

/** Matches opening fence `\`\`\`yaml journal`. */
const YAML_JOURNAL_FENCE_MARKER = 'yaml journal';

/**
 * Omit nullish/empty subtrees (sparse emission §8).
 *
 * @param {unknown} v
 * @returns {unknown | undefined}
 */
function pruneSparseJournalTree(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === 'string') return v.trim() === '' ? undefined : v;
  if (typeof v !== 'object') return v;
  if (Array.isArray(v)) {
    const out = [];
    for (const el of v) {
      const p = pruneSparseJournalTree(el);
      if (p !== undefined) out.push(p);
    }
    return out.length === 0 ? undefined : out;
  }
  const obj = {};
  for (const k of Object.keys(v)) {
    const p = pruneSparseJournalTree(/** @type {Record<string, unknown>} */ (v)[k]);
    if (p !== undefined) obj[k] = p;
  }
  return Object.keys(obj).length === 0 ? undefined : obj;
}

/**
 * @param {string} k
 */
function yamlKeyScalar(k) {
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(k)) return k;
  return JSON.stringify(k);
}

/**
 * @param {unknown} v
 */
function yamlScalar(v) {
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isFinite(v) ? String(v) : 'null';
  if (v === null || v === undefined) return 'null';
  return JSON.stringify(String(v));
}

/**
 * YAML list under a key (`key:\n  - …`).
 *
 * @param {unknown[]} arr
 * @param {number} hyphenIndentLevel Indent depth (2 spaces each) where `- ` begins after the parent's key line.
 */
function emitArrayYaml(arr, hyphenIndentLevel) {
  let s = '';
  const hyphenPad = '  '.repeat(hyphenIndentLevel);
  for (const raw of arr) {
    const pr = pruneSparseJournalTree(raw);
    if (pr === undefined) continue;
    if (typeof pr !== 'object' || pr === null || Array.isArray(pr)) {
      if (Array.isArray(pr)) {
        s += `${hyphenPad}-\n`;
        s += emitArrayYaml(
          /** @type {unknown[]} */ (pr),
          hyphenIndentLevel + 1,
        );
        continue;
      }
      s += `${hyphenPad}- ${yamlScalar(pr)}\n`;
      continue;
    }
    const o = /** @type {Record<string, unknown>} */ (pr);
    s += `${hyphenPad}-\n`;
    s += emitMapYaml(o, hyphenIndentLevel + 1);
  }
  return s;
}

/**
 * @param {Record<string, unknown>} obj
 * @param {number} indent nesting level (starts at 0)
 */
function emitMapYaml(obj, indent) {
  const pad = '  '.repeat(indent);
  let s = '';
  for (const rawKey of Object.keys(obj)) {
    const valRaw = /** @type {unknown} */ (obj[rawKey]);
    const k = yamlKeyScalar(rawKey);
    const val = pruneSparseJournalTree(valRaw);
    if (val === undefined) continue;

    if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
      s += `${pad}${k}:\n`;
      s += emitMapYaml(/** @type {Record<string, unknown>} */ (val), indent + 1);
      continue;
    }
    if (Array.isArray(val)) {
      s += `${pad}${k}:\n`;
      s += emitArrayYaml(/** @type {unknown[]} */ (val), indent + 1);
      continue;
    }
    s += `${pad}${k}: ${yamlScalar(val)}\n`;
  }
  return s;
}

/**
 * Produce full `\`\`\`yaml journal … \`\`\`\n` block.
 *
 * @param {Record<string, unknown>} payload
 */
function formatYamlJournalFenceFromPayload(payload) {
  const prunedRaw = pruneSparseJournalTree(JSON.parse(JSON.stringify(payload)));
  const root =
    typeof prunedRaw === 'object' &&
    prunedRaw !== null &&
    !Array.isArray(prunedRaw)
      ? /** @type {Record<string, unknown>} */ (prunedRaw)
      : {};

  let body =
    Object.keys(root).length === 0
      ? `date: ${yamlScalar(payload?.date)}`
      : emitMapYaml(root, 0).replace(/\s+$/, '');

  if (!body.trim()) body = `date: ${yamlScalar(payload?.date)}`;

  return (
    '`'.repeat(3) + YAML_JOURNAL_FENCE_MARKER + `\n${body}\n` + '`'.repeat(3) + '\n'
  );
}

/**
 * Dual-writer daily journal (.md): Tracker-head + verbatim Oura-tail.
 * @see docs/DAILY_LOG_DUAL_WRITER.md
 */

/**
 * @param {unknown} obj
 * @returns {boolean}
 */
function isWearableOnlyRoot(obj) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return false;
  const keys = Object.keys(obj);
  return keys.length === 1 && keys[0] === 'wearable_biometrics';
}

/**
 * @typedef {{ start: number, end: number, raw: string, parsed: unknown }} JsonFence
 */

/**
 * @param {string} content
 * @returns {JsonFence[]}
 */
function findJsonFences(content) {
  const fences = [];
  if (!content) return fences;
  // Require ```json opener — avoids treating ```yaml/closing fences as generic JSON fences.
  const re = /(^|\n)```(?:json|JSON)\s*\r?\n([\s\S]*?)\r?\n```/g;
  let m;
  while ((m = re.exec(content)) !== null) {
    const openerLen = m[1] ? m[1].length : 0;
    const start = m.index + openerLen;
    const end = m.index + m[0].length;
    const raw = m[2];
    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = null;
    }
    fences.push({ start, end, raw, parsed });
  }
  return fences;
}

/**
 * @param {string} content
 * @returns {boolean}
 */
function rawFenceLooksWearable(raw) {
  return typeof raw === 'string' && raw.includes('"wearable_biometrics"');
}

/**
 * @param {string} content
 * @returns {JsonFence[]}
 */
function findWearableFences(content) {
  const text = String(content || '');
  const parsed = findJsonFences(text).filter(
    (f) =>
      (f.parsed &&
        typeof f.parsed === 'object' &&
        !Array.isArray(f.parsed) &&
        f.parsed.wearable_biometrics != null &&
        typeof f.parsed.wearable_biometrics === 'object') ||
      rawFenceLooksWearable(f.raw)
  );
  if (parsed.length) return parsed;
  const span = wearableFenceSpanByMarker(text);
  return span ? [span] : [];
}

/**
 * Locate wearable ``` fence by marker when JSON.parse fails.
 * @param {string} content
 * @returns {JsonFence|null}
 */
function wearableFenceSpanByMarker(content) {
  const marker = '"wearable_biometrics"';
  const midx = content.lastIndexOf(marker);
  if (midx < 0) return null;
  const before = content.slice(0, midx);
  let openIdx = -1;
  for (const tag of ['```json', '```JSON']) {
    const i = before.lastIndexOf(tag);
    if (i > openIdx) openIdx = i;
  }
  if (openIdx < 0) return null;
  const lineStart = openIdx > 0 && content[openIdx - 1] === '\n' ? openIdx : openIdx;
  const start = content[openIdx - 1] === '\n' ? openIdx : openIdx;
  let closeIdx = content.indexOf('\n```', midx);
  if (closeIdx < 0) {
    closeIdx = content.lastIndexOf('```', midx);
    if (closeIdx < 0) return null;
  }
  const end = closeIdx + 4;
  return {
    start,
    end: Math.min(end, content.length),
    raw: content.slice(start, end),
    parsed: null,
  };
}

/**
 * @param {string} content
 * @param {number} charIndex
 * @returns {number}
 */
function lineIndexAtChar(content, charIndex) {
  const lines = content.split('\n');
  let offset = 0;
  for (let i = 0; i < lines.length; i++) {
    const lineStart = offset;
    const lineEnd = offset + lines[i].length;
    if (charIndex >= lineStart && charIndex <= lineEnd) return i;
    offset = lineEnd + 1;
  }
  return lines.length - 1;
}

/**
 * @param {string} content
 * @param {number} fenceStart
 * @returns {number|null}
 */
function findOuraTailOpenerIndex(content, fenceStart) {
  const lines = content.split('\n');
  const fenceLineIdx = lineIndexAtChar(content, fenceStart);
  if (fenceLineIdx < 0) return null;

  for (let i = fenceLineIdx - 1; i >= 0; i--) {
    const t = lines[i].trim();
    if (t === '') continue;
    if (t === '---') {
      let opener = 0;
      for (let j = 0; j < i; j++) opener += lines[j].length + 1;
      return opener;
    }
    break;
  }
  return fenceStart;
}

/**
 * Slice from last --- or opening ``` before wearable_biometrics through EOF.
 * @param {string} content
 * @returns {string|null}
 */
function extractOuraTailByMarker(content) {
  const text = String(content || '');
  const marker = '"wearable_biometrics"';
  const idx = text.lastIndexOf(marker);
  if (idx < 0) return null;
  const before = text.slice(0, idx);
  const sep = before.lastIndexOf('\n---');
  const fence = Math.max(
    before.lastIndexOf('\n```json'),
    before.lastIndexOf('\n```JSON'),
  );
  let start = -1;
  if (sep >= 0 && (fence < 0 || sep > fence)) start = sep + 1;
  else if (fence >= 0) start = fence + 1;
  else return null;
  return text.slice(start);
}

/**
 * @typedef {{ ok: true, hasTail: boolean, head: string, tail: string|null, wearableFenceCount: number } | { ok: false, error: string, wearableFenceCount: number }} JournalSplit
 */

/**
 * @param {string|null|undefined} content
 * @returns {JournalSplit}
 */
function splitJournalFile(content) {
  const text = content == null ? '' : String(content);
  if (!text) {
    return { ok: true, hasTail: false, head: '', tail: null, wearableFenceCount: 0 };
  }
  const wearable = findWearableFences(text);
  if (wearable.length > 1) {
    return {
      ok: false,
      error:
        'Daily log has more than one wearable_biometrics JSON fence. Leave only one tail block before saving.',
      wearableFenceCount: wearable.length,
    };
  }
  if (wearable.length === 0) {
    return { ok: true, hasTail: false, head: text, tail: null, wearableFenceCount: 0 };
  }
  const fence = wearable[wearable.length - 1];
  let opener = findOuraTailOpenerIndex(text, fence.start);
  if (opener == null) {
    const tail = extractOuraTailByMarker(text);
    if (!tail) {
      return {
        ok: false,
        error: 'Daily log has wearable_biometrics but tail boundary could not be determined.',
        wearableFenceCount: wearable.length,
      };
    }
    return {
      ok: true,
      hasTail: true,
      head: text.slice(0, text.length - tail.length),
      tail,
      wearableFenceCount: wearable.length,
    };
  }
  return {
    ok: true,
    hasTail: true,
    head: text.slice(0, opener),
    tail: text.slice(opener),
    wearableFenceCount: wearable.length,
  };
}

/**
 * @typedef {{ ok: true, file: string } | { ok: false, error: string }} ComposeResult
 */

/**
 * @param {string|null|undefined} existingFile
 * @param {string} trackerHeadNew
 * @returns {ComposeResult}
 */
function composeJournalFile(existingFile, trackerHeadNew) {
  let headNew = trackerHeadNew == null ? '' : String(trackerHeadNew);
  const existing = existingFile == null ? '' : String(existingFile);
  const split = splitJournalFile(existing);
  if (!split.ok) return { ok: false, error: split.error };
  if (!split.hasTail) {
    if (existing.includes('"wearable_biometrics"')) {
      const tail = extractOuraTailByMarker(existing);
      if (tail) {
        if (headNew.length && !headNew.endsWith('\n') && !tail.startsWith('\n')) headNew += '\n';
        return { ok: true, file: headNew + tail };
      }
      return {
        ok: false,
        error:
          'Daily log contains Oura data but the tail could not be preserved. Drive sync skipped to avoid data loss.',
      };
    }
    return { ok: true, file: headNew };
  }
  if (headNew.length && !headNew.endsWith('\n') && split.tail && !split.tail.startsWith('\n')) {
    headNew += '\n';
  }
  return { ok: true, file: headNew + split.tail };
}

/**
 * @param {string} content
 * @returns {object|null}
 */
function parseWearableBiometricsReadOnly(content) {
  const wearable = findWearableFences(String(content || ''));
  if (wearable.length !== 1) return null;
  if (wearable[0].parsed && typeof wearable[0].parsed === 'object') {
    return wearable[0].parsed.wearable_biometrics;
  }
  return wearable[0].raw ? {} : null;
}

/** Number field schema + Other card Save helpers (REQ-4, REQ-5). */

function isHourUnit(u) {
  const x = String(u || '').toLowerCase();
  return x === 'hour' || x === 'hours' || x === 'hr' || x === 'h';
}

function isMinuteUnit(u) {
  const x = String(u || '').toLowerCase();
  return x === 'minutes' || x === 'minute' || x === 'min' || x === 'mins';
}

/** Step: number / decimal, or `:N` for colon-stepped UI (:N = seconds if unit is minutes, else minutes if unit is hours). */
function parseStepSpec(step, unit) {
  if (step === undefined || step === null || step === '') {
    return { mode: 'number', step: null, colonKind: null };
  }
  const s = String(step).trim();
  if (s.startsWith(':')) {
    const n = parseFloat(s.slice(1));
    if (!Number.isFinite(n) || n <= 0) return { mode: 'number', step: null, colonKind: null };
    if (isHourUnit(unit)) return { mode: 'colon', colonKind: 'hour_minutes', step: n };
    return { mode: 'colon', colonKind: 'minute_seconds', step: n };
  }
  const n = parseFloat(s);
  if (Number.isFinite(n)) return { mode: 'number', step: n, colonKind: null };
  return { mode: 'number', step: null, colonKind: null };
}

function fieldStepSpec(f) {
  return parseStepSpec(f?.step, f?.u);
}

function isColonStepField(f) {
  return fieldStepSpec(f).mode === 'colon';
}

function numberFieldSpec(f) {
  const spec = {
    min: null,
    max: null,
    step: null,
    def: null,
    stepSpec: null,
    colon: false,
  };
  if (!f || f.t !== 'number') return spec;
  if (f.def === null) spec.def = null;
  for (const k of ['min', 'max', 'def']) {
    if (f[k] === undefined || f[k] === null || f[k] === '') continue;
    if (k === 'def' && f.def === null) continue;
    const n = Number(f[k]);
    if (Number.isFinite(n)) spec[k] = n;
  }
  if (f.step !== undefined && f.step !== null && f.step !== '') {
    const ss = String(f.step).trim();
    if (ss.startsWith(':')) spec.step = ss;
    else {
      const n = Number(f.step);
      if (Number.isFinite(n)) spec.step = n;
    }
  }
  spec.stepSpec = fieldStepSpec(f);
  spec.colon = spec.stepSpec.mode === 'colon';
  return spec;
}

function secondsToMmSs(totalSec) {
  const sec = Math.max(0, Math.round(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function parseMmSs(str) {
  if (str === undefined || str === null || str === '') return null;
  if (typeof str === 'number' && Number.isFinite(str)) return Math.round(str * 60);
  const s = String(str).trim();
  if (!s.includes(':')) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }
  const parts = s.split(':');
  const m = parseInt(parts[0], 10) || 0;
  const sec = parseInt(parts[1], 10) || 0;
  return m * 60 + sec;
}

function minutesToHourMin(totalMin) {
  const min = Math.max(0, Math.round(totalMin));
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h + ':' + String(m).padStart(2, '0');
}

function parseHourMin(str) {
  if (str === undefined || str === null || str === '') return null;
  if (typeof str === 'number' && Number.isFinite(str)) return Math.round(str * 60);
  const s = String(str).trim();
  if (!s.includes(':')) {
    const n = parseFloat(s);
    return Number.isFinite(n) ? Math.round(n * 60) : null;
  }
  const parts = s.split(':');
  const h = parseInt(parts[0], 10) || 0;
  const m = parseInt(parts[1], 10) || 0;
  return h * 60 + m;
}

function colonSelectOptions(f) {
  const spec = fieldStepSpec(f);
  if (spec.mode !== 'colon') return [];
  const min = f.min != null ? Number(f.min) : 0;
  const max = f.max != null ? Number(f.max) : null;
  const opts = [];
  if (spec.colonKind === 'minute_seconds') {
    const minSec = min * 60;
    const maxSec = max != null ? max * 60 : minSec + 3600;
    for (let t = minSec; t <= maxSec + 1e-9; t += spec.step) {
      const v = secondsToMmSs(t);
      opts.push({ value: v, label: v });
      if (opts.length >= 300) break;
    }
  } else {
    const startMin = min * 60;
    const endMin = (max != null ? max : min + 4) * 60;
    for (let t = startMin; t <= endMin + 1e-9; t += spec.step) {
      const v = minutesToHourMin(t);
      opts.push({ value: v, label: v });
      if (opts.length >= 300) break;
    }
  }
  return opts;
}

/** First option for logging UI: omit field on save when selected. */
const NUMBER_SELECT_EMPTY = { value: '', label: '\u2014' };

function withEmptyNumberOption(opts) {
  return [NUMBER_SELECT_EMPTY, ...(opts || [])];
}

function shouldUseNumberSelect(spec, f) {
  if (spec.colon || (f && isColonStepField(f))) {
    return colonSelectOptions(f).length >= 1 && colonSelectOptions(f).length <= 300;
  }
  if (spec.min == null || spec.max == null || spec.step == null) return false;
  const step = spec.step || 1;
  if (step <= 0) return false;
  const count = Math.floor((spec.max - spec.min) / step) + 1;
  return count >= 1 && count <= 300;
}

function formatFieldDefaultValue(f, raw) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (isColonStepField(f)) {
    if (typeof raw === 'string' && String(raw).includes(':')) return String(raw);
    const n = Number(raw);
    if (!Number.isFinite(n)) return undefined;
    const kind = fieldStepSpec(f).colonKind;
    if (kind === 'minute_seconds') return secondsToMmSs(Math.round(n * 60));
    if (kind === 'hour_minutes') return minutesToHourMin(Math.round(n * 60));
  }
  const spec = numberFieldSpec(f);
  return coalesceNumberValue(raw, spec);
}

function coalesceColonValue(val, f) {
  if (val !== undefined && val !== null && val !== '') {
    if (typeof val === 'string' && val.includes(':')) return val;
    const formatted = formatFieldDefaultValue(f, val);
    if (formatted !== undefined) return formatted;
  }
  if (f.def !== undefined && f.def !== null && f.def !== '') {
    return formatFieldDefaultValue(f, f.def);
  }
  return undefined;
}

function coalesceNumberValue(val, spec) {
  if (val !== undefined && val !== null && val !== '') {
    if (typeof val === 'string' && val.includes(':')) return val;
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
  }
  if (spec.def !== null && spec.def !== undefined && Number.isFinite(Number(spec.def))) {
    return Number(spec.def);
  }
  return undefined;
}

/** Activity with list field suitable for card Save (list first, optional number siblings). */
function actListCardProfile(a) {
  if (!a || a.inline === false || !Array.isArray(a.flds) || !a.flds.length) return null;
  const listField = a.flds.find((ff) => ff.t === 'opts');
  if (!listField) return null;
  const valueFields = a.flds.filter((ff) => ff.t === 'number');
  return { listField, valueFields };
}

function defaultsFromFirstOpt(listField, selectedVals) {
  if (!listField?.opts?.length || !selectedVals?.length) return {};
  const first = String(selectedVals[0]);
  const opt = listField.opts.find((o) => String(o.v) === first);
  if (!opt?.defaults || typeof opt.defaults !== 'object') return {};
  return { ...opt.defaults };
}

/** Build flds for card Save; null/undefined numeric defaults are omitted. */
function buildCardActivityFlds(profile, pending) {
  const flds = {};
  if (!profile?.listField || !pending) return flds;
  const { listField, valueFields } = profile;
  const vals =
    pending.multi && Array.isArray(pending.vals)
      ? pending.vals.map(String).filter(Boolean)
      : pending.val !== undefined && pending.val !== null && String(pending.val) !== ''
        ? [String(pending.val)]
        : [];
  if (!vals.length) return flds;
  flds[listField.nm] = listField.multi ? vals : vals[0];
  const defs = defaultsFromFirstOpt(listField, vals);
  for (const ff of valueFields) {
    let raw = defs[ff.nm];
    if (raw === undefined || raw === null || raw === '') {
      if (ff.def !== undefined && ff.def !== null && ff.def !== '') {
        raw = ff.def;
      }
    }
    if (raw === undefined || raw === null || raw === '') continue;
    const v = formatFieldDefaultValue(ff, raw);
    if (v !== undefined) flds[ff.nm] = v;
  }
  return flds;
}

function formatOptDefaultsLines(listField, valueFields) {
  if (!listField?.opts?.length || !valueFields?.length) return [];
  return listField.opts
    .map((o) => {
      const parts = valueFields
        .map((ff) => {
          const v = o.defaults?.[ff.nm];
          if (v === undefined || v === null || v === '') return '';
          const disp = isColonStepField(ff) ? formatFieldDefaultValue(ff, v) : v;
          return `${ff.nm}: ${disp}${ff.u && !isColonStepField(ff) ? ' ' + ff.u : ''}`;
        })
        .filter(Boolean);
      return { label: o.v, text: parts.join(' · ') };
    })
    .filter((x) => x.text);
}

/** Field-level def on number siblings (when list opts have no per-option defaults). */
function formatFieldDefLines(valueFields) {
  if (!valueFields?.length) return [];
  return valueFields
    .filter((ff) => ff.def !== null && ff.def !== undefined && ff.def !== '')
    .map((ff) => {
      const disp = isColonStepField(ff) ? formatFieldDefaultValue(ff, ff.def) : ff.def;
      return { text: `${ff.nm}: ${disp}${ff.u && !isColonStepField(ff) ? ' ' + ff.u : ''}` };
    });
}

function formatCardDefaultSummary(profile, selectedVals) {
  if (!profile?.valueFields?.length || !selectedVals?.length) return '';
  const defs = defaultsFromFirstOpt(profile.listField, selectedVals);
  const parts = profile.valueFields
    .map((ff) => {
      const v = defs[ff.nm];
      if (v === undefined || v === null || v === '') return '';
      const disp = isColonStepField(ff) ? formatFieldDefaultValue(ff, v) : v;
      return `${ff.nm}: ${disp}${ff.u && !isColonStepField(ff) ? ' ' + ff.u : ''}`;
    })
    .filter(Boolean);
  return parts.join(' · ');
}

function stepFieldHelpText(unit) {
  if (isHourUnit(unit)) {
    return 'Step: number = hours, or :15 = 15-minute steps (saves H:MM, e.g. 1:30)';
  }
  if (isMinuteUnit(unit)) {
    return 'Step: number = minutes, or :30 = 30-second steps (saves M:SS, e.g. 5:30)';
  }
  return 'Step: number = field units, or :N = colon steps (seconds for minutes, minutes for hours)';
}

/** Tab visibility config (REQ-1). */

const TAB_IDS = ['water', 'supps', 'food', 'other', 'notes', 'log', 'settings'];

const DEFAULT_TAB_VISIBILITY = {
  water: true,
  supps: true,
  food: true,
  other: true,
  notes: true,
  log: true,
  settings: true,
};

function normalizeTabVisibility(tabs) {
  const out = { ...DEFAULT_TAB_VISIBILITY, ...(tabs || {}) };
  out.settings = true;
  for (const id of TAB_IDS) {
    if (typeof out[id] !== 'boolean') out[id] = DEFAULT_TAB_VISIBILITY[id];
  }
  return out;
}

function isTabVisible(tabs, id) {
  if (id === 'settings') return true;
  return normalizeTabVisibility(tabs)[id] !== false;
}

function visibleTabIds(tabs) {
  return TAB_IDS.filter((id) => isTabVisible(tabs, id));
}

/**
 * Phase 2 — unified log list/get/update/delete for history and export helpers.
 * Display labels remain in app UI; this module owns array access + day filter.
 */

const LOG_TYPES = ['water', 'supps', 'food', 'other', 'notes'];

/** @returns {{ key: string, arr: unknown[] }[]} */
function arraysForType(state, type) {
  if (type === 'water') return [{ key: 'wl', arr: state.wl || [] }];
  if (type === 'supps') {
    return [
      { key: 'sl', arr: state.sl || [] },
      { key: 'snotes', arr: state.snotes || [] },
    ];
  }
  if (type === 'food') {
    return [
      { key: 'fl', arr: state.fl || [] },
      { key: 'fnotes', arr: state.fnotes || [] },
    ];
  }
  if (type === 'other') return [{ key: 'al', arr: state.al || [] }];
  if (type === 'notes') return [{ key: 'notes', arr: state.notes || [] }];
  return [];
}

function logEntryDay(entry, isoToLocalYMD) {
  if (!entry?.dt) return '';
  return isoToLocalYMD(entry.dt);
}

function filterByDay(entries, day, isoToLocalYMD) {
  if (!day) return entries.slice();
  return entries.filter((e) => logEntryDay(e, isoToLocalYMD) === day);
}

function sortEntries(entries, sort) {
  const rows = entries.slice();
  if (sort === 'oldest') rows.sort((a, b) => String(a.dt).localeCompare(String(b.dt)));
  else rows.sort((a, b) => String(b.dt).localeCompare(String(a.dt)));
  return rows;
}

function listLogs(state, type, { day, sort = 'newest' } = {}, isoToLocalYMD) {
  let rows = [];
  if (type === 'water') rows = state.wl || [];
  else if (type === 'supps') rows = [...(state.sl || []), ...(state.snotes || [])];
  else if (type === 'food') {
    rows = [
      ...(state.fl || []).filter((e) => e.fid !== '__meal__'),
      ...(state.fnotes || []),
    ];
  } else if (type === 'other') rows = state.al || [];
  else if (type === 'notes') rows = state.notes || [];
  rows = filterByDay(rows, day, isoToLocalYMD);
  return sortEntries(rows, sort);
}

function getLog(state, type, id) {
  for (const { arr } of arraysForType(state, type)) {
    const hit = arr.find((x) => x.id === id);
    if (hit) return hit;
  }
  return null;
}

function updateLogDt(state, type, ids, newDt) {
  const set = new Set(ids);
  let count = 0;
  for (const { arr } of arraysForType(state, type)) {
    arr.forEach((e) => {
      if (set.has(e.id)) {
        e.dt = newDt;
        count++;
      }
    });
  }
  return count;
}

function updateLogs(state, type, ids, patch) {
  const set = new Set(ids);
  let count = 0;
  for (const { arr } of arraysForType(state, type)) {
    arr.forEach((e) => {
      if (set.has(e.id)) {
        Object.assign(e, patch);
        count++;
      }
    });
  }
  return count;
}

function removeLogIds(state, type, ids) {
  const set = new Set(ids);
  if (type === 'water') state.wl = (state.wl || []).filter((x) => !set.has(x.id));
  else if (type === 'supps') {
    state.sl = (state.sl || []).filter((x) => !set.has(x.id));
    state.snotes = (state.snotes || []).filter((x) => !set.has(x.id));
  } else if (type === 'food') {
    state.fl = (state.fl || []).filter((x) => !set.has(x.id));
    state.fnotes = (state.fnotes || []).filter((x) => !set.has(x.id));
  } else if (type === 'other') state.al = (state.al || []).filter((x) => !set.has(x.id));
  else if (type === 'notes') state.notes = (state.notes || []).filter((x) => !set.has(x.id));
  return state;
}

function combinedTrackerLogText(dates, renderDay) {
  return dates.map((d) => renderDay(d)).join('\n\n');
}

/** [[token]] picker: supplement names + custom entries (Notes and all note textareas). */

function suppWikiToken(mfr, name) {
  const p = String(name || '').trim();
  const m =
    mfr && mfr !== '--' && String(mfr).trim() ? String(mfr).trim() : null;
  if (m && p) return '[[' + m + ' ' + p + ']]';
  if (p) return '[[' + p + ']]';
  return '[[Unknown]]';
}

function wikiTokenSortKey(token) {
  return String(token || '')
    .replace(/^\[\[|\]\]$/g, '')
    .toLowerCase();
}

/** All tokens for picker: catalog + custom, minus hidden, A–Z. */
function listWikiTokens(state, query) {
  const hidden = new Set(state.noteWikiHidden || []);
  const custom = state.noteWikiCustom || [];
  const fromSm = (state.sm || []).map((m) => suppWikiToken(m.mfr, m.name));
  const all = [...new Set([...fromSm, ...custom])].filter((t) => t && !hidden.has(t));
  all.sort((a, b) => wikiTokenSortKey(a).localeCompare(wikiTokenSortKey(b)));
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return all;
  return all.filter((t) => wikiTokenSortKey(t).includes(q));
}

/** All tokens for manage screen (includes hidden), A–Z. */
function listWikiTokensForManage(state) {
  const hidden = new Set(state.noteWikiHidden || []);
  const custom = new Set(state.noteWikiCustom || []);
  const fromSm = (state.sm || []).map((m) => ({
    token: suppWikiToken(m.mfr, m.name),
    fromCatalog: true,
  }));
  const seen = new Set();
  const rows = [];
  for (const row of fromSm) {
    if (seen.has(row.token)) continue;
    seen.add(row.token);
    rows.push({ ...row, hidden: hidden.has(row.token) });
  }
  for (const t of custom) {
    if (!t || seen.has(t)) continue;
    seen.add(t);
    rows.push({ token: t, fromCatalog: false, hidden: hidden.has(t) });
  }
  rows.sort((a, b) =>
    wikiTokenSortKey(a.token).localeCompare(wikiTokenSortKey(b.token))
  );
  return rows;
}

/** If cursor is after [[ or [[]], return { start, query } for replacement. */
function noteWikiTriggerAt(text, cursor) {
  const before = String(text || '').slice(0, cursor);
  const m = before.match(/\[\[([^\]]*)$/);
  if (!m) return null;
  return { start: cursor - m[0].length, query: m[1] };
}

/**
 * Daily log export: normalized field keys (field_unit), tab-aware sections.
 */




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
function exportFieldKey(f) {
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

function exportValueForField(ff, raw) {
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
function normalizeActivityExport(flds, act) {
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

function tabVisibleForExport(tabs, id) {
  return isTabVisible(tabs, id);
}

/** Drop null-only branches from payload before JSON fence. */
function pruneExportPayload(payload) {
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

global.DT = {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
  findJsonFences,
  formatYamlJournalFenceFromPayload,
  pruneSparseJournalTree,
  YAML_JOURNAL_FENCE_MARKER,
  numberFieldSpec,
  shouldUseNumberSelect,
  coalesceNumberValue,
  actListCardProfile,
  defaultsFromFirstOpt,
  buildCardActivityFlds,
  formatCardDefaultSummary,
  formatOptDefaultsLines,
  formatFieldDefLines,
  isColonStepField,
  fieldStepSpec,
  colonSelectOptions,
  coalesceColonValue,
  formatFieldDefaultValue,
  stepFieldHelpText,
  parseStepSpec,
  withEmptyNumberOption,
  NUMBER_SELECT_EMPTY,
  suppWikiToken,
  listWikiTokens,
  listWikiTokensForManage,
  noteWikiTriggerAt,
  exportFieldKey,
  normalizeActivityExport,
  exportValueForField,
  pruneExportPayload,
  tabVisibleForExport,
  TAB_IDS,
  DEFAULT_TAB_VISIBILITY,
  normalizeTabVisibility,
  isTabVisible,
  visibleTabIds,
  logEntryDay,
  filterByDay,
  listLogs,
  removeLogIds,
  combinedTrackerLogText,
  LOG_TYPES,
  arraysForType,
  getLog,
  updateLogDt,
  updateLogs,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
