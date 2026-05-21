import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatYamlJournalFenceFromPayload,
  pruneSparseJournalTree,
  YAML_JOURNAL_FENCE_MARKER,
} from '../src/domain/journal-yaml-format.js';

describe('journal-yaml-format', () => {
  it('fence marker spelling', () => {
    assert.equal(YAML_JOURNAL_FENCE_MARKER, 'yaml journal');
  });

  it('drops empty arrays and null-bearing branches', () => {
    const p = pruneSparseJournalTree({
      date: '2026-05-19',
      empty_arr: [],
      nested: { a: null, b: 1 },
    });
    assert.equal(p.nested.a, undefined);
    assert.equal(p.empty_arr, undefined);
    assert.deepEqual(p.nested, { b: 1 });
  });

  it('formats list-of-maps deterministically', () => {
    const fence = formatYamlJournalFenceFromPayload({
      date: '2026-05-19',
      water_logged: [
        { qty_oz: 8, time: '9:05 AM', logged_at: '2026-05-19T14:05:02Z', notes: null },
      ],
    });
    assert.ok(fence.startsWith('```yaml journal\n'));
    assert.ok(fence.endsWith('```\n'));
    assert.ok(fence.includes('water_logged:'));
    assert.ok(fence.includes('logged_at'));
  });
});
