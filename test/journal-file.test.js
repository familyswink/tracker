import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  composeJournalFile,
  splitJournalFile,
  isWearableOnlyRoot,
  findWearableFences,
  parseWearableBiometricsReadOnly,
  extractOuraTailByMarker,
} from '../src/domain/journal-file.js';
import { formatYamlJournalFenceFromPayload } from '../src/domain/journal-yaml-format.js';

const TRACKER_PAYLOAD = {
  date: '2026-05-19',
  day_of_week: 'Monday',
  total_water_intake_oz: 32,
};
const TRACKER_HEAD = `# Monday — 2026-05-19

## Notes
* test


${formatYamlJournalFenceFromPayload(/** @type {Record<string, unknown>} */ (TRACKER_PAYLOAD))}`;

const OURA_TAIL = `---
\`\`\`json
{
  "wearable_biometrics": {
    "sync_metadata": { "source": "oura_loader" },
    "readiness": { "score": 85 }
  }
}
\`\`\`
`;

const FULL = TRACKER_HEAD + OURA_TAIL;

describe('isWearableOnlyRoot', () => {
  it('accepts only wearable_biometrics key', () => {
    assert.equal(isWearableOnlyRoot({ wearable_biometrics: {} }), true);
  });
  it('rejects tracker daily payload', () => {
    assert.equal(isWearableOnlyRoot({ date: '2026-05-19', water_logged: [] }), false);
  });
  it('rejects extra top-level keys', () => {
    assert.equal(isWearableOnlyRoot({ wearable_biometrics: {}, date: 'x' }), false);
  });
});

describe('splitJournalFile', () => {
  it('no wearable fence → entire file is head', () => {
    const r = splitJournalFile(TRACKER_HEAD);
    assert.equal(r.ok, true);
    assert.equal(r.hasTail, false);
    assert.equal(r.head, TRACKER_HEAD);
    assert.equal(r.tail, null);
  });

  it('splits at --- before wearable fence', () => {
    const r = splitJournalFile(FULL);
    assert.equal(r.ok, true);
    assert.equal(r.hasTail, true);
    assert.equal(r.head, TRACKER_HEAD);
    assert.equal(r.tail, OURA_TAIL);
  });

  it('multiple wearable fenced blocks refuse split', () => {
    const second = '\n---\n```json\n{"wearable_biometrics":{"stale":true}}\n```\n';
    const r = splitJournalFile(FULL + second);
    assert.equal(r.ok, false);
    assert.match(r.error, /more than one/i);
  });

  it('allows blank line between --- and wearable fence', () => {
    const tail = '---\n\n```json\n{"wearable_biometrics":{"x":1}}\n```\n';
    const r = splitJournalFile(TRACKER_HEAD + tail);
    assert.equal(r.ok, true);
    assert.equal(r.hasTail, true);
    assert.equal(r.tail, tail);
  });

  it('allows wearable fence without preceding ---', () => {
    const tail = '```json\n{"wearable_biometrics":{"x":1}}\n```\n';
    const r = splitJournalFile(TRACKER_HEAD + tail);
    assert.equal(r.ok, true);
    assert.equal(r.hasTail, true);
    assert.equal(r.tail, tail);
  });

  it('detects wearable when root has only nested wearable key (strict) or object', () => {
    const tail = '---\n```json\n{"wearable_biometrics":{"sync_metadata":{}}}\n```\n';
    const r = splitJournalFile(TRACKER_HEAD + tail);
    assert.equal(r.ok, true);
    assert.equal(r.hasTail, true);
  });

  it('preserves tail when wearable JSON does not parse', () => {
    const tail = '---\n```json\n{ "wearable_biometrics": { "score": 1, }\n```\n';
    const file = TRACKER_HEAD + tail;
    const r = composeJournalFile(file, TRACKER_HEAD.replace('32', '40'));
    assert.equal(r.ok, true);
    assert.ok(r.file.includes('"score": 1'));
    assert.ok(r.file.includes('40'));
  });
});

describe('extractOuraTailByMarker', () => {
  it('returns tail slice from --- before marker', () => {
    const tail = extractOuraTailByMarker(FULL);
    assert.ok(tail);
    assert.ok(tail.includes('wearable_biometrics'));
  });
});

describe('composeJournalFile', () => {
  it('without tail writes head only', () => {
    const r = composeJournalFile(null, TRACKER_HEAD);
    assert.equal(r.ok, true);
    assert.equal(r.file, TRACKER_HEAD);
  });

  it('with tail preserves tail bytes verbatim', () => {
    const newHead = TRACKER_HEAD.replace('32', '64');
    const r = composeJournalFile(FULL, newHead);
    assert.equal(r.ok, true);
    assert.ok(r.file.includes('64'));
    assert.ok(r.file.endsWith(OURA_TAIL) || r.file.includes(OURA_TAIL.trimEnd()));
    const tailStart = r.file.indexOf('---\n```json\n{\n  "wearable_biometrics"');
    assert.ok(tailStart >= 0);
    assert.equal(r.file.slice(tailStart), OURA_TAIL);
  });

  it('does not reformat wearable JSON whitespace', () => {
    const spaced = OURA_TAIL.replace('"source": "oura_loader"', '"source":  "oura_loader"');
    const file = TRACKER_HEAD + spaced;
    const r = composeJournalFile(file, TRACKER_HEAD);
    assert.equal(r.ok, true);
    assert.ok(r.file.includes('"source":  "oura_loader"'));
  });
});

describe('parseWearableBiometricsReadOnly', () => {
  it('returns nested object when one wearable fence', () => {
    const w = parseWearableBiometricsReadOnly(FULL);
    assert.equal(w.sync_metadata.source, 'oura_loader');
  });
  it('returns null when no wearable fence', () => {
    assert.equal(parseWearableBiometricsReadOnly(TRACKER_HEAD), null);
  });
});
