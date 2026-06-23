import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateBulkChangeSelection,
  validateTemplateOnePerDay,
  slEntryMid,
} from '../src/domain/supp-history.js';

const state = {
  sm: [{ id: 'm1', name: 'Mag' }, { id: 'm2', name: 'LMNT' }],
  sch: [
    { id: 's1', mid: 'm1', on: true },
    { id: 's2', mid: 'm2', on: true },
  ],
  sl: [],
};

function isoLocal(ymd, hh, mm) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0).toISOString();
}

state.sl = [
  { id: '1', sid: 's1', dt: isoLocal('2026-05-01', 8, 0), qty: 2 },
  { id: '2', sid: 's1', dt: isoLocal('2026-05-02', 8, 0), qty: 2 },
  { id: '3', sid: 's2', dt: isoLocal('2026-05-01', 10, 0), qty: 1 },
];

describe('supp-history', () => {
  it('slEntryMid resolves catalog id', () => {
    assert.equal(slEntryMid(state, state.sl[0]), 'm1');
  });

  it('validateBulkChangeSelection rejects mixed supplements', () => {
    const r = validateBulkChangeSelection(state, [state.sl[0], state.sl[2]]);
    assert.equal(r.ok, false);
  });

  it('validateBulkChangeSelection accepts single supplement', () => {
    const r = validateBulkChangeSelection(state, [state.sl[0], state.sl[1]]);
    assert.equal(r.ok, true);
    assert.equal(r.mid, 'm1');
  });

  it('validateTemplateOnePerDay requires exactly one log per day', () => {
    const ok = validateTemplateOnePerDay(state, 'm1', '2026-05-01', '2026-05-02', () => false);
    assert.equal(ok.ok, true);
    assert.equal(ok.templateLogs.length, 2);
    const bad = validateTemplateOnePerDay(state, 'm2', '2026-05-01', '2026-05-02', () => false);
    assert.equal(bad.ok, false);
  });
});
