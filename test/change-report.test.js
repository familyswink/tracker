import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  aggregateSupplementDay,
  buildChangeReport,
  clockMinutesApart,
  diffDay,
  diffSupplementMid,
  prevCalendarDay,
  supplementDaysEquivalent,
} from '../src/domain/change-report.js';

function stateWithMagnesium() {
  const mid = 'mag1';
  const sidBreakfast = 'sch-b';
  const sidOther = 'sch-o';
  return {
    sm: [{ id: mid, name: 'Magnesium glycinate', mfr: 'Pure', units: 'capsule', trackChange: true }],
    sch: [
      { id: sidBreakfast, mid, grp: 'breakfast', qty: 2, on: true },
      { id: sidOther, mid, grp: 'other', qty: 2, on: true },
    ],
    suppGroups: [
      { id: 'breakfast', lb: 'Breakfast' },
      { id: 'other', lb: 'Other' },
    ],
    sl: [],
    fd: [],
    acts: [],
    cfg: { changeWindowHours: 4 },
  };
}

function isoLocal(ymd, hh, mm) {
  const [y, m, d] = ymd.split('-').map(Number);
  return new Date(y, m - 1, d, hh, mm, 0).toISOString();
}

function logAt(state, sid, ymd, hh, mm, qty, sk) {
  state.sl.push({
    id: 'l' + state.sl.length,
    sid,
    dt: isoLocal(ymd, hh, mm),
    qty,
    sk: !!sk,
  });
}

describe('change-report supplements', () => {
  it('clockMinutesApart wraps 24h circle', () => {
    assert.equal(clockMinutesApart(10 * 60, 11 * 60), 60);
    assert.equal(clockMinutesApart(23 * 60, 1 * 60), 120);
  });

  it('magnesium timeline: 6/2 vs 6/1 no change', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-o', dt: isoLocal('2026-06-02', 11, 0), qty: 2, sk: false },
    ];
    const d = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.deepEqual(d.added, []);
    assert.deepEqual(d.removed, []);
    assert.equal(supplementDaysEquivalent(
      aggregateSupplementDay(S, '2026-06-01', 'mag1'),
      aggregateSupplementDay(S, '2026-06-02', 'mag1'),
      4,
    ), true);
  });

  it('magnesium timeline: 6/3 vs 6/2 reports transition in removed', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-o', dt: isoLocal('2026-06-02', 11, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-b', dt: isoLocal('2026-06-03', 9, 0), qty: 1, sk: false },
    ];
    const d = diffSupplementMid(S, 'mag1', '2026-06-02', '2026-06-03', 4);
    assert.equal(d.added.length, 0);
    assert.equal(d.removed.length, 1);
    assert.match(d.removed[0], /went from 2 Other to 1 at Breakfast/);
  });

  it('forgot to log today marks prior as removed', () => {
    const S = stateWithMagnesium();
    S.sl = [{ id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false }];
    const d = diffDay(S, '2026-06-01', '2026-06-02', 4);
    assert.equal(d.added.length, 0);
    assert.ok(d.removed.some((x) => x.includes('not taken')));
  });

  it('buildChangeReport includes blank row when no changes', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-o', dt: isoLocal('2026-06-02', 11, 0), qty: 2, sk: false },
    ];
    const rows = buildChangeReport(S, '2026-06-02', '2026-06-02', 4);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].date, '2026-06-02');
    assert.deepEqual(rows[0].added, []);
    assert.deepEqual(rows[0].removed, []);
  });

  it('skipped today shows not taken', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-b', dt: isoLocal('2026-06-02', 10, 0), qty: 0, sk: true },
    ];
    const d = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.ok(d.removed.length > 0 || d.added.some((x) => x.includes('skipped')));
  });

  it('prevCalendarDay', () => {
    assert.equal(prevCalendarDay('2026-06-03'), '2026-06-02');
  });
});
