/* Daily Tracker — journal + domain (dual-writer, Phase 2) */
(function (global) {
'use strict';
/** @module core/date — local calendar and ISO helpers (source of truth for Phase 1+) */

function now() {
  return new Date().toISOString();
}

function localDateYMD(d) {
  return (
    d.getFullYear() +
    '-' +
    String(d.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(d.getDate()).padStart(2, '0')
  );
}

function td() {
  return localDateYMD(new Date());
}

function wks() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return localDateYMD(d);
}

function isoToLocalYMD(iso) {
  if (!iso) return localDateYMD(new Date());
  const s = String(iso).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return td();
  return localDateYMD(d);
}

function isoToTimeLocal(iso) {
  if (!iso) return '12:00';
  const d = new Date(iso);
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

/** Build ISO from local date + time (never rely on UTC slice of ISO strings). */
function dateAndTimeToISO(dateStr, timeStr) {
  if (!dateStr) return new Date().toISOString();
  const p = String(dateStr).split('-').map((x) => parseInt(x, 10));
  const tm = (timeStr || '12:00').split(':');
  const hh = parseInt(tm[0], 10) || 0;
  const mm = parseInt(tm[1], 10) || 0;
  const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1, hh, mm, 0, 0);
  if (isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function logEntryDay(e) {
  return isoToLocalYMD(e && (e.dt || e.la || ''));
}

function matchesLogDay(eDt, logIso) {
  return !!(eDt && logIso) && isoToLocalYMD(eDt) === isoToLocalYMD(logIso);
}

function onLogDay(iso, dt) {
  return iso && isoToLocalYMD(iso) === dt;
}

function getEffectiveLogDt(state) {
  return state.gdt || now();
}

function logDateKey(state) {
  return isoToLocalYMD(getEffectiveLogDt(state));
}

/** @module domain/food — session vs daily food quantities */


/**
 * @param {{ fl?: Array<{fid:string,dt:string,la?:string,qty:number}>, flSave?: string|null, gdt?: string|null }} state
 */
function gDFQ(state, fid) {
  const logDay = isoToLocalYMD(getEffectiveLogDt(state));
  return (state.fl || [])
    .filter((e) => String(e.fid) === String(fid) && isoToLocalYMD(e.dt) === logDay)
    .reduce((s, e) => s + e.qty, 0);
}

/**
 * Session quantity since flSave (resets after global Save / Load Meal).
 */
function gTFQ(state, fid) {
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

function gWFQ(state, fid) {
  const ws = wks();
  return (state.fl || [])
    .filter((e) => e.fid === fid && isoToLocalYMD(e.dt) >= ws)
    .reduce((s, e) => s + e.qty, 0);
}

function bumpFlSave(state, ts) {
  const t = ts || now();
  state.flSave = new Date(new Date(t).getTime() + 1).toISOString();
}

/** @module session/save — global Save lifecycle (pure; DOM in resetAfterSave) */



function emptyStaging() {
  return {
    supSt: {},
    supAdhoc: {},
    otherSt: {},
    pendingWater: null,
  };
}

/** Apply pre-persist Save side effects (flSave bump, clear gdt). Returns snapshot for rollback. */
function prepareGlobalSave(state, saveTs = now()) {
  const snapshot = { prevFlSave: state.flSave ?? null, prevGdt: state.gdt ?? null };
  bumpFlSave(state, saveTs);
  state.gdt = null;
  return snapshot;
}

function rollbackGlobalSave(state, snapshot) {
  state.flSave = snapshot.prevFlSave;
  state.gdt = snapshot.prevGdt;
}

/** Clear staging maps in place (keeps caller's object references, e.g. global _supSt). */
function clearStagingAfterSave(staging) {
  if (staging.supSt) {
    for (const k of Object.keys(staging.supSt)) delete staging.supSt[k];
  }
  if (staging.supAdhoc) {
    for (const k of Object.keys(staging.supAdhoc)) delete staging.supAdhoc[k];
  }
  if (staging.otherSt) {
    for (const k of Object.keys(staging.otherSt)) delete staging.otherSt[k];
  }
  staging.pendingWater = null;
}

const NOTE_IDS = ['noteQuick', 'foodNoteQuick', 'suppNoteQuick', 'otherNoteQuick', 'neBd', 'seNt'];

/**
 * @param {(id: string) => { value: string, classList: { remove: (c: string) => void } } | null} getEl
 */
function resetAfterSave(getEl) {
  NOTE_IDS.forEach((id) => {
    const el = getEl(id);
    if (el) {
      el.value = '';
      el.classList.remove('note-dirty');
    }
  });
}

/**
 * Phase 3 — unified global Save orchestration.
 * Persist commits are injected from app.js (domain-specific).
 */



/**
 * @typedef {Object} StagedRollback
 * @property {string[]} [addedWl]
 * @property {string[]} [addedSl]
 * @property {string[]} [addedAL]
 * @property {string} [batchDay]
 * @property {boolean} [hadCommits]
 */

/**
 * @typedef {Object} CommitGlobalSaveOptions
 * @property {Record<string, unknown>} state
 * @property {{ supSt: object, supAdhoc: object, otherSt: object, pendingWater: unknown }} staging
 * @property {() => void} [flushQuickNotes]
 * @property {() => StagedRollback} commitStaged
 * @property {() => boolean} persist
 * @property {(staged: StagedRollback) => void} [rollbackStaged]
 * @property {() => void} [resetUi]
 * @property {(staged: StagedRollback) => void | Promise<void>} [afterSuccess]
 */

/**
 * Single Save path: staged commits → bump flSave / clear gdt → persist → clear staging → UI reset.
 * @param {CommitGlobalSaveOptions} opts
 * @returns {Promise<{ ok: boolean, staged?: StagedRollback }>}
 */
async function commitGlobalSave(opts) {
  opts.flushQuickNotes?.();
  const staged = opts.commitStaged();
  const saveTs = now();
  const snap = prepareGlobalSave(/** @type {any} */ (opts.state), saveTs);
  if (!opts.persist()) {
    rollbackGlobalSave(/** @type {any} */ (opts.state), snap);
    opts.rollbackStaged?.(staged);
    return { ok: false, staged };
  }
  clearStagingAfterSave(opts.staging);
  opts.resetUi?.();
  if (opts.afterSuccess) await opts.afterSuccess(staged);
  return { ok: true, staged };
}

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
  if (!spec.colon) {
    if (spec.min == null && spec.max == null) {
      if (isMinuteUnit(f.u)) {
        spec.min = 0;
        spec.max = 180;
      } else if (isHourUnit(f.u)) {
        spec.min = 0;
        spec.max = 24;
      } else {
        const u = String(f.u || '').toLowerCase();
        if (u === 'f' || u === '°f' || u === 'fahrenheit') {
          spec.min = 32;
          spec.max = 220;
        } else if (u === 'c' || u === '°c' || u === 'celsius') {
          spec.min = 0;
          spec.max = 100;
        }
      }
    }
    if (spec.step == null && spec.min != null && spec.max != null) spec.step = 1;
  }
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

/** Number fields use scroll wheel by default; set wheel: false for manual entry. */
function fieldUseWheel(f) {
  return !!(f && f.t === 'number' && f.wheel !== false);
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

/** Choices currently selected on a List field (`multi` ⇒ string[], else string). */
function optsChosenValues(f, val) {
  if (val === undefined || val === null || val === '') return [];
  if (f?.multi) {
    if (Array.isArray(val)) return val.map(String).filter(Boolean);
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return [];
      try {
        const p = JSON.parse(s);
        if (Array.isArray(p)) return p.map(String).filter(Boolean);
      } catch {
        /* plain string */
      }
      return [s];
    }
    return [];
  }
  if (Array.isArray(val)) return val.length ? [String(val[0])] : [];
  if (typeof val === 'string') {
    const s = val.trim();
    if (!s) return [];
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p) && p.length) return [String(p[0])];
    } catch {
      /* plain string */
    }
    return [s];
  }
  return [String(val)];
}

function formatOptsFieldDisplay(f, v) {
  const picked = optsChosenValues(f, v);
  if (!picked.length) return '';
  if (f?.multi) return picked.join(', ');
  return picked[0];
}

/** Normalize list value for storage (scalar when single-select). */
function normalizeOptsStored(f, v) {
  const picked = optsChosenValues(f, v);
  if (!picked.length) return undefined;
  return f?.multi ? picked : picked[0];
}

function defaultsFromFirstOpt(listField, selectedVals) {
  if (!listField?.opts?.length || !selectedVals?.length) return {};
  const first = String(selectedVals[0]);
  const opt = listField.opts.find((o) => String(o.v) === first);
  if (!opt?.defaults || typeof opt.defaults !== 'object') return {};
  return { ...opt.defaults };
}

/** Resolve list choices from pending state (uses field schema, not stale pending.multi). */
function pendingListVals(listField, pending) {
  if (!listField || !pending || pending.fieldNm !== listField.nm) return [];
  if (listField.multi) {
    if (Array.isArray(pending.vals)) return pending.vals.map(String).filter(Boolean);
    if (pending.val !== undefined && pending.val !== null && String(pending.val) !== '') {
      return [String(pending.val)];
    }
    return [];
  }
  if (pending.val !== undefined && pending.val !== null && String(pending.val) !== '') {
    return [String(pending.val)];
  }
  return [];
}

/** Build flds for card Save; null/undefined numeric defaults are omitted. */
function buildCardActivityFlds(profile, pending) {
  const flds = {};
  if (!profile?.listField || !pending) return flds;
  const { listField, valueFields } = profile;
  const vals = pendingListVals(listField, pending);
  if (!vals.length) return flds;
  const stored = normalizeOptsStored(listField, listField.multi ? vals : vals[0]);
  if (stored === undefined) return flds;
  flds[listField.nm] = stored;
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

function filterByDay(entries, day) {
  if (!day) return entries.slice();
  return entries.filter((e) => logEntryDay(e) === day);
}

function sortEntries(entries, sort) {
  const rows = entries.slice();
  if (sort === 'oldest') rows.sort((a, b) => String(a.dt).localeCompare(String(b.dt)));
  else rows.sort((a, b) => String(b.dt).localeCompare(String(a.dt)));
  return rows;
}

function listLogs(state, type, { day, sort = 'newest' } = {}) {
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
  rows = filterByDay(rows, day);
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
      if (ff.multi && Array.isArray(v)) out[key] = v.map(String).filter(Boolean);
      else if (Array.isArray(v)) out[key] = v.length ? String(v[0]) : undefined;
      else out[key] = v;
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

/**
 * Day-over-day change report (supplements, food, water, other).
 * Compares each calendar day to the prior day using localStorage log data.
 * Supplements use per-log pairing within the change window (Model 1).
 */


function prevCalendarDay(ymd) {
  const p = String(ymd).split('-').map((x) => parseInt(x, 10));
  const d = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  d.setDate(d.getDate() - 1);
  return localDateYMD(d);
}

function datesInRangeInclusive(startYmd, endYmd) {
  const a = String(startYmd);
  const b = String(endYmd);
  if (!a || !b) return [];
  let s = a;
  let e = b;
  if (s > e) [s, e] = [e, s];
  const out = [];
  const cur = s.split('-').map((x) => parseInt(x, 10));
  let dt = new Date(cur[0], cur[1] - 1, cur[2]);
  const endParts = e.split('-').map((x) => parseInt(x, 10));
  const endDt = new Date(endParts[0], endParts[1] - 1, endParts[2]);
  while (dt <= endDt) {
    out.push(localDateYMD(dt));
    dt.setDate(dt.getDate() + 1);
  }
  return out;
}

function minutesOfDayFromIso(iso) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.getHours() * 60 + d.getMinutes();
}

/** Shortest distance between two clock times on a 24h circle. */
function clockMinutesApart(a, b) {
  if (a == null || b == null) return Infinity;
  const diff = Math.abs(a - b);
  return Math.min(diff, 1440 - diff);
}

function isTrackChangeSupp(m) {
  return m && m.trackChange !== false;
}

function isTrackChangeFood(f) {
  return !!(f && f.trackChange === true);
}

function isTrackChangeAct(a) {
  return !!(a && a.trackChange === true);
}

function isTrackChangeWater(cfg) {
  return !!(cfg && cfg.trackWaterChange === true);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function suppDisplayName(state, mid) {
  const m = (state.sm || []).find((x) => x.id === mid);
  if (!m) return 'Unknown';
  const mfr = m.mfr && m.mfr !== '--' ? m.mfr + ' — ' : '';
  return mfr + (m.name || 'Unknown');
}

function suppUnits(state, mid) {
  const m = (state.sm || []).find((x) => x.id === mid);
  return m?.units || '';
}

function resolveMidFromLog(state, entry) {
  const sc = (state.sch || []).find((x) => x.id === entry.sid);
  return sc?.mid;
}

function isWaterSuppLog(state, entry) {
  const mid = resolveMidFromLog(state, entry);
  const m = (state.sm || []).find((x) => x.id === mid);
  return !!(m && m.name === 'Water');
}

function formatQty(qty, units) {
  const q = Number(qty);
  const s = Number.isInteger(q) ? String(q) : String(q);
  return units ? s + ' ' + units : s;
}

/** @param {string} iso @param {string} [ymd] optional anchor date for label */
function formatChangeLogTime(iso, ymd) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const dayYmd = ymd || isoToLocalYMD(iso);
  const p = dayYmd.split('-').map((x) => parseInt(x, 10));
  const mo = MONTHS[(p[1] || 1) - 1] || '';
  const day = p[2] || d.getDate();
  let h = d.getHours();
  const m = d.getMinutes();
  const ap = h >= 12 ? 'p' : 'a';
  h = h % 12 || 12;
  const mm = m ? ':' + String(m).padStart(2, '0') : '';
  return mo + ' ' + day + ' ' + h + mm + ap;
}

function formatDaySpan(prevYmd, ymd, prevIso, currIso) {
  if (prevIso && currIso) {
    return formatChangeLogTime(prevIso, prevYmd) + ' → ' + formatChangeLogTime(currIso, ymd);
  }
  if (prevIso) return formatChangeLogTime(prevIso, prevYmd);
  if (currIso) return formatChangeLogTime(currIso, ymd);
  return prevYmd && ymd && prevYmd !== ymd ? prevYmd + ' → ' + ymd : ymd || prevYmd || '—';
}

/** Non-skipped supplement logs for one catalog item on one day. */
function collectSupplementLogs(state, ymd, mid) {
  const logs = [];
  for (const e of state.sl || []) {
    if (!onLogDay(e.dt, ymd)) continue;
    if (resolveMidFromLog(state, e) !== mid) continue;
    if (isWaterSuppLog(state, e)) continue;
    if (e.sk) continue;
    const qty = parseFloat(e.qty) || 0;
    if (qty <= 0) continue;
    logs.push({
      qty,
      timeMin: minutesOfDayFromIso(e.dt),
      iso: e.dt,
    });
  }
  logs.sort((a, b) => (a.timeMin ?? 0) - (b.timeMin ?? 0));
  return logs;
}

/**
 * Pair yesterday/today logs by closest clock time within window.
 * @returns {Array<{ kind: 'same'|'changed'|'stopped'|'started', prev?: object, curr?: object }>}
 */
function pairSupplementLogs(prevLogs, currLogs, windowHours) {
  const windowMin = (Number(windowHours) > 0 ? Number(windowHours) : 4) * 60;
  const usedCurr = new Set();
  const pairs = [];

  for (const prev of prevLogs) {
    let bestIdx = -1;
    let bestDist = Infinity;
    currLogs.forEach((curr, idx) => {
      if (usedCurr.has(idx)) return;
      const dist = clockMinutesApart(prev.timeMin, curr.timeMin);
      if (dist <= windowMin && dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    if (bestIdx >= 0) {
      usedCurr.add(bestIdx);
      const curr = currLogs[bestIdx];
      if (prev.qty === curr.qty) pairs.push({ kind: 'same', prev, curr });
      else pairs.push({ kind: 'changed', prev, curr });
    } else {
      pairs.push({ kind: 'stopped', prev });
    }
  }

  currLogs.forEach((curr, idx) => {
    if (!usedCurr.has(idx)) pairs.push({ kind: 'started', curr });
  });

  return pairs;
}

function ymdToSortMs(ymd, iso) {
  const p = String(ymd).split('-').map((x) => parseInt(x, 10));
  const base = new Date(p[0], (p[1] || 1) - 1, p[2] || 1);
  if (iso) {
    const d = new Date(iso);
    if (!isNaN(d.getTime())) {
      base.setHours(d.getHours(), d.getMinutes(), d.getSeconds(), 0);
    }
  } else {
    base.setHours(12, 0, 0, 0);
  }
  return base.getTime();
}

/** Clock time (minutes) when a prior-day dose is considered missed on the comparison day. */
function doseDeadlineMinutesOnDay(prevTimeMin, windowHours) {
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;
  if (prevTimeMin == null) return null;
  return prevTimeMin + wh * 60;
}

/** Hide "stopped" rows on today until the prior dose time + change window has passed. */
function isStoppedGraceActive(comparisonYmd, prevTimeMin, windowHours, asOf = new Date()) {
  const today = localDateYMD(asOf);
  if (comparisonYmd !== today) return false;
  const deadline = doseDeadlineMinutesOnDay(prevTimeMin, windowHours);
  if (deadline == null) return false;
  const nowMin = asOf.getHours() * 60 + asOf.getMinutes();
  return nowMin < deadline;
}

/** Sort rows by comparison date, then clock time on that day. */
function sortChangeReportRows(rows) {
  return [...rows].sort((a, b) => {
    const da = String(a.date);
    const db = String(b.date);
    if (da !== db) return da < db ? -1 : 1;
    const ta = a.sortAt ?? ymdToSortMs(a.date);
    const tb = b.sortAt ?? ymdToSortMs(b.date);
    if (ta !== tb) return ta - tb;
    return String(a.item).localeCompare(String(b.item));
  });
}

function totalLogQty(logs) {
  return logs.reduce((s, l) => s + l.qty, 0);
}

/** @returns {Array<{ date, item, was, now, time }>} */
function diffSupplementMid(state, mid, prevYmd, ymd, windowHours, asOf = new Date()) {
  const prevLogs = collectSupplementLogs(state, prevYmd, mid);
  const currLogs = collectSupplementLogs(state, ymd, mid);
  if (!prevLogs.length && !currLogs.length) return [];

  const totalPrev = totalLogQty(prevLogs);
  const totalCurr = totalLogQty(currLogs);
  // Same daily total: split/merge/time shifts are not dose changes (e.g. 1×2 yesterday → 2×1 today).
  if (totalPrev === totalCurr && totalPrev > 0) return [];

  const item = suppDisplayName(state, mid);
  const units = suppUnits(state, mid);
  const rows = [];

  for (const p of pairSupplementLogs(prevLogs, currLogs, windowHours)) {
    if (p.kind === 'same') continue;
    if (p.kind === 'stopped') {
      if (isStoppedGraceActive(ymd, p.prev.timeMin, windowHours, asOf)) continue;
      rows.push({
        date: ymd,
        item,
        was: formatQty(p.prev.qty, units),
        now: '—',
        time: formatChangeLogTime(p.prev.iso, prevYmd),
        sortAt: ymdToSortMs(ymd, p.prev.iso),
      });
    } else if (p.kind === 'started') {
      rows.push({
        date: ymd,
        item,
        was: '—',
        now: formatQty(p.curr.qty, units),
        time: formatChangeLogTime(p.curr.iso, ymd),
        sortAt: ymdToSortMs(ymd, p.curr.iso),
      });
    } else if (p.kind === 'changed') {
      rows.push({
        date: ymd,
        item,
        was: formatQty(p.prev.qty, units),
        now: formatQty(p.curr.qty, units),
        time: formatDaySpan(prevYmd, ymd, p.prev.iso, p.curr.iso),
        sortAt: ymdToSortMs(ymd, p.curr.iso),
      });
    }
  }
  return rows;
}

function aggregateFoodDay(state, ymd, fid) {
  let qty = 0;
  for (const e of state.fl || []) {
    if (!onLogDay(e.dt, ymd)) continue;
    if (e.fid !== fid || e.fid === '__meal__') continue;
    qty += parseFloat(e.qty) || 0;
  }
  return qty;
}

function diffFoodItem(state, fid, prevYmd, ymd) {
  const prev = aggregateFoodDay(state, prevYmd, fid);
  const curr = aggregateFoodDay(state, ymd, fid);
  if (prev === curr) return [];
  const f = (state.fd || []).find((x) => x.id === fid);
  const item = f?.nm || 'Unknown';
  if (prev === 0 && curr > 0) {
    return [{ date: ymd, item, was: '—', now: curr + ' servings', time: ymd, sortAt: ymdToSortMs(ymd) }];
  }
  if (prev > 0 && curr === 0) {
    return [{ date: ymd, item, was: prev + ' servings', now: '—', time: prevYmd, sortAt: ymdToSortMs(ymd) }];
  }
  return [
    {
      date: ymd,
      item,
      was: prev + ' servings',
      now: curr + ' servings',
      time: prevYmd + ' → ' + ymd,
      sortAt: ymdToSortMs(ymd),
    },
  ];
}

function aggregateWaterDay(state, ymd) {
  let total = 0;
  for (const e of state.wl || []) {
    if (onLogDay(e.dt, ymd)) total += parseFloat(e.qty) || 0;
  }
  return Math.round(total * 10) / 10;
}

function diffWater(state, prevYmd, ymd) {
  const prev = aggregateWaterDay(state, prevYmd);
  const curr = aggregateWaterDay(state, ymd);
  if (prev === curr) return [];
  const item = 'Water';
  if (prev === 0 && curr > 0) {
    return [{ date: ymd, item, was: '—', now: curr + ' oz', time: ymd, sortAt: ymdToSortMs(ymd) }];
  }
  if (prev > 0 && curr === 0) {
    return [{ date: ymd, item, was: prev + ' oz', now: '—', time: prevYmd, sortAt: ymdToSortMs(ymd) }];
  }
  return [{ date: ymd, item, was: prev + ' oz', now: curr + ' oz', time: prevYmd + ' → ' + ymd, sortAt: ymdToSortMs(ymd) }];
}

function otherEntryLabel(state, entry) {
  const act = (state.acts || []).find((x) => x.id === entry.aid);
  const type = act?.nm || 'Other';
  const parts = [type];
  for (const [k, v] of Object.entries(entry.flds || {})) {
    if (v === '' || v == null || (Array.isArray(v) && !v.length)) continue;
    parts.push(k + ': ' + (Array.isArray(v) ? v.join(', ') : String(v)));
  }
  if (entry.nt && String(entry.nt).trim()) parts.push('notes: ' + entry.nt.trim());
  return parts.join(' — ');
}

function diffOtherActivity(state, aid, prevYmd, ymd) {
  const prevEntries = (state.al || []).filter((e) => e.aid === aid && onLogDay(e.dt, prevYmd));
  const currEntries = (state.al || []).filter((e) => e.aid === aid && onLogDay(e.dt, ymd));
  if (!prevEntries.length && !currEntries.length) return [];
  const act = (state.acts || []).find((x) => x.id === aid);
  const item = act?.nm || 'Other';
  const rows = [];
  const prevS = new Set(prevEntries.map((e) => otherEntryLabel(state, e)));
  const currS = new Set(currEntries.map((e) => otherEntryLabel(state, e)));
  for (const e of prevEntries) {
    const label = otherEntryLabel(state, e);
    if (!currS.has(label)) {
      rows.push({ date: ymd, item, was: label, now: '—', time: prevYmd, sortAt: ymdToSortMs(ymd, e.dt) });
    }
  }
  for (const e of currEntries) {
    const label = otherEntryLabel(state, e);
    if (!prevS.has(label)) {
      rows.push({ date: ymd, item, was: '—', now: label, time: ymd, sortAt: ymdToSortMs(ymd, e.dt) });
    }
  }
  return rows;
}

function diffDay(state, prevYmd, ymd, windowHours, asOf = new Date()) {
  const rows = [];
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;

  for (const m of state.sm || []) {
    if (!isTrackChangeSupp(m)) continue;
    if (m.name === 'Water') continue;
    rows.push(...diffSupplementMid(state, m.id, prevYmd, ymd, wh, asOf));
  }

  for (const f of state.fd || []) {
    if (!isTrackChangeFood(f)) continue;
    rows.push(...diffFoodItem(state, f.id, prevYmd, ymd));
  }

  if (isTrackChangeWater(state.cfg)) {
    rows.push(...diffWater(state, prevYmd, ymd));
  }

  for (const a of state.acts || []) {
    if (!isTrackChangeAct(a)) continue;
    rows.push(...diffOtherActivity(state, a.id, prevYmd, ymd));
  }

  return rows;
}

/** Only rows where something changed (no quiet days). */
function buildChangeReport(state, startYmd, endYmd, windowHours, asOf = new Date()) {
  const days = datesInRangeInclusive(startYmd, endYmd);
  const wh = Number(windowHours) > 0 ? Number(windowHours) : 4;
  const asOfDate = asOf instanceof Date && !isNaN(asOf.getTime()) ? asOf : new Date();
  const rows = [];
  for (const date of days) {
    const prev = prevCalendarDay(date);
    rows.push(...diffDay(state, prev, date, wh, asOfDate));
  }
  return sortChangeReportRows(rows);
}

function filterChangeReportRows(rows, query) {
  const q = String(query || '')
    .trim()
    .toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const blob = [row.date, row.item, row.was, row.now, row.time].join(' ').toLowerCase();
    return blob.includes(q);
  });
}

function formatChangeReportMarkdown(rows) {
  const lines = ['# Change report', '', '| Date | Item | Was | Now | Time |', '| --- | --- | --- | --- | --- |'];
  for (const row of rows) {
    const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
    lines.push(
      '| ' +
        [esc(row.date), esc(row.item), esc(row.was), esc(row.now), esc(row.time)].join(' | ') +
        ' |',
    );
  }
  return lines.join('\n');
}

function formatChangeReportCsv(rows) {
  const esc = (s) => {
    const t = String(s ?? '');
    if (/[",\n]/.test(t)) return '"' + t.replace(/"/g, '""') + '"';
    return t;
  };
  const lines = ['date,item,was,now,time'];
  for (const row of rows) {
    lines.push([esc(row.date), esc(row.item), esc(row.was), esc(row.now), esc(row.time)].join(','));
  }
  return lines.join('\n');
}

global.DT = {
  now,
  td,
  wks,
  localDateYMD,
  isoToLocalYMD,
  isoToTimeLocal,
  dateAndTimeToISO,
  logEntryDay,
  matchesLogDay,
  onLogDay,
  getEffectiveLogDt,
  logDateKey,
  gDFQ,
  gTFQ,
  gWFQ,
  bumpFlSave,
  prepareGlobalSave,
  rollbackGlobalSave,
  clearStagingAfterSave,
  resetAfterSave,
  emptyStaging,
  commitGlobalSave,
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
  fieldUseWheel,
  coalesceNumberValue,
  actListCardProfile,
  optsChosenValues,
  formatOptsFieldDisplay,
  normalizeOptsStored,
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
  filterByDay,
  listLogs,
  removeLogIds,
  combinedTrackerLogText,
  LOG_TYPES,
  arraysForType,
  getLog,
  updateLogDt,
  updateLogs,
  prevCalendarDay,
  datesInRangeInclusive,
  buildChangeReport,
  sortChangeReportRows,
  filterChangeReportRows,
  formatChangeReportMarkdown,
  formatChangeReportCsv,
  diffSupplementMid,
  collectSupplementLogs,
  pairSupplementLogs,
  formatChangeLogTime,
  isTrackChangeSupp,
  isTrackChangeFood,
  isTrackChangeAct,
  isTrackChangeWater,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
