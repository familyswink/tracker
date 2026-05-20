/**
 * Dual-writer daily journal (.md): Tracker-head + verbatim Oura-tail.
 * @see REFACTOR_SPEC.md § "Dual-writer daily logs" and docs/DAILY_LOG_DUAL_WRITER.md
 */

/**
 * @param {unknown} obj
 * @returns {boolean}
 */
export function isWearableOnlyRoot(obj) {
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
export function findJsonFences(content) {
  const fences = [];
  if (!content) return fences;
  const re = /(^|\n)```json\s*\n([\s\S]*?)\n```/g;
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
 * Canonical Oura wearable fence: root { wearable_biometrics } only, typically last in file.
 * @param {string} content
 * @returns {JsonFence[]}
 */
export function findWearableFences(content) {
  return findJsonFences(content).filter((f) => f.parsed && isWearableOnlyRoot(f.parsed));
}

/**
 * Index where Oura-tail begins: the `---` line immediately above the wearable ```json fence.
 * @param {string} content
 * @param {number} fenceStart index of opening ```json for wearable block
 * @returns {number|null}
 */
export function findOuraTailOpenerIndex(content, fenceStart) {
  const lines = content.split('\n');
  let offset = 0;
  let fenceLineIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const lineStart = offset;
    const lineEnd = offset + lines[i].length;
    if (fenceStart >= lineStart && fenceStart <= lineEnd) {
      fenceLineIdx = i;
      break;
    }
    offset = lineEnd + 1;
  }
  if (fenceLineIdx <= 0) return null;
  if (lines[fenceLineIdx - 1].trim() !== '---') return null;
  let opener = 0;
  for (let i = 0; i < fenceLineIdx - 1; i++) opener += lines[i].length + 1;
  return opener;
}

/**
 * @typedef {{ ok: true, hasTail: boolean, head: string, tail: string|null, wearableFenceCount: number } | { ok: false, error: string, wearableFenceCount: number }} JournalSplit
 */

/**
 * @param {string|null|undefined} content
 * @returns {JournalSplit}
 */
export function splitJournalFile(content) {
  const text = content == null ? '' : String(content);
  if (!text) {
    return { ok: true, hasTail: false, head: '', tail: null, wearableFenceCount: 0 };
  }
  const wearable = findWearableFences(text);
  if (wearable.length === 0) {
    return { ok: true, hasTail: false, head: text, tail: null, wearableFenceCount: 0 };
  }
  if (wearable.length > 1) {
    return {
      ok: false,
      error:
        'Daily log has multiple wearable_biometrics JSON blocks. Fix the file in Drive (or run the Oura injector repair) before saving from Tracker.',
      wearableFenceCount: wearable.length,
    };
  }
  const fence = wearable[wearable.length - 1];
  const opener = findOuraTailOpenerIndex(text, fence.start);
  if (opener == null) {
    return {
      ok: false,
      error:
        'Daily log has wearable_biometrics JSON but no --- line directly above it. Cannot preserve Oura tail safely.',
      wearableFenceCount: 1,
    };
  }
  return {
    ok: true,
    hasTail: true,
    head: text.slice(0, opener),
    tail: text.slice(opener),
    wearableFenceCount: 1,
  };
}

/**
 * @typedef {{ ok: true, file: string } | { ok: false, error: string }} ComposeResult
 */

/**
 * Regenerate Tracker-head only; append verbatim Oura-tail when present.
 * @param {string|null|undefined} existingFile
 * @param {string} trackerHeadNew
 * @returns {ComposeResult}
 */
export function composeJournalFile(existingFile, trackerHeadNew) {
  const headNew = trackerHeadNew == null ? '' : String(trackerHeadNew);
  const split = splitJournalFile(existingFile);
  if (!split.ok) return { ok: false, error: split.error };
  if (!split.hasTail) {
    return { ok: true, file: headNew };
  }
  return { ok: true, file: headNew + split.tail };
}

/**
 * Optional read-only parse of wearable block from file (never re-serialize for save).
 * @param {string} content
 * @returns {object|null}
 */
export function parseWearableBiometricsReadOnly(content) {
  const wearable = findWearableFences(String(content || ''));
  if (wearable.length !== 1) return null;
  const root = wearable[0].parsed;
  return root && typeof root === 'object' ? root.wearable_biometrics : null;
}
