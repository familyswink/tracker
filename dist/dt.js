/* Daily Tracker — journal (dual-writer) */
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

global.DT = {
  composeJournalFile,
  splitJournalFile,
  parseWearableBiometricsReadOnly,
  isWearableOnlyRoot,
  findJsonFences,
  formatYamlJournalFenceFromPayload,
  pruneSparseJournalTree,
  YAML_JOURNAL_FENCE_MARKER,
};
})(typeof globalThis !== 'undefined' ? globalThis : window);
