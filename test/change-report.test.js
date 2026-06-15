import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildChangeReport,
  clockMinutesApart,
  collectSupplementLogs,
  diffDay,
  diffSupplementMid,
  formatChangeLogTime,
  pairSupplementLogs,
  prevCalendarDay,
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

describe('change-report supplements (Model 1)', () => {
  it('clockMinutesApart wraps 24h circle', () => {
    assert.equal(clockMinutesApart(10 * 60, 11 * 60), 60);
    assert.equal(clockMinutesApart(23 * 60, 1 * 60), 120);
  });

  it('same qty within 4h window produces no row (group move ignored)', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-o', dt: isoLocal('2026-06-02', 11, 0), qty: 2, sk: false },
    ];
    const rows = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.equal(rows.length, 0);
  });

  it('qty change at paired time produces Was/Now row', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-o', dt: isoLocal('2026-06-02', 11, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-b', dt: isoLocal('2026-06-03', 9, 0), qty: 1, sk: false },
    ];
    const rows = diffSupplementMid(S, 'mag1', '2026-06-02', '2026-06-03', 4);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].item, 'Pure — Magnesium glycinate');
    assert.equal(rows[0].was, '2 capsule');
    assert.equal(rows[0].now, '1 capsule');
    assert.match(rows[0].time, /→/);
  });

  it('AM and PM logs can produce two rows when both slots change', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 8, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-o', dt: isoLocal('2026-06-01', 20, 0), qty: 2, sk: false },
      { id: '3', sid: 'sch-b', dt: isoLocal('2026-06-02', 8, 0), qty: 1, sk: false },
      { id: '4', sid: 'sch-o', dt: isoLocal('2026-06-02', 20, 0), qty: 2, sk: false },
    ];
    const rows = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].was, '2 capsule');
    assert.equal(rows[0].now, '1 capsule');
  });

  it('forgot to log today marks stopped row with yesterday time', () => {
    const S = stateWithMagnesium();
    S.sl = [{ id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false }];
    const rows = diffDay(S, '2026-06-01', '2026-06-02', 4);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].was, '2 capsule');
    assert.equal(rows[0].now, '—');
    assert.match(rows[0].time, /Jun 1/);
  });

  it('no log yesterday or today produces no rows', () => {
    const S = stateWithMagnesium();
    const rows = buildChangeReport(S, '2026-06-02', '2026-06-02', 4);
    assert.equal(rows.length, 0);
  });

  it('buildChangeReport omits quiet days', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-o', dt: isoLocal('2026-06-02', 11, 0), qty: 2, sk: false },
    ];
    const rows = buildChangeReport(S, '2026-06-02', '2026-06-02', 4);
    assert.equal(rows.length, 0);
  });

  it('skipped today after taken yesterday is stopped', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-b', dt: isoLocal('2026-06-02', 10, 0), qty: 0, sk: true },
    ];
    const rows = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].now, '—');
  });

  it('pairSupplementLogs matches AM to AM not PM', () => {
    const prev = [
      { qty: 2, timeMin: 8 * 60, iso: isoLocal('2026-06-01', 8, 0) },
      { qty: 2, timeMin: 20 * 60, iso: isoLocal('2026-06-01', 20, 0) },
    ];
    const curr = [
      { qty: 2, timeMin: 8 * 60 + 30, iso: isoLocal('2026-06-02', 8, 30) },
      { qty: 2, timeMin: 20 * 60 + 15, iso: isoLocal('2026-06-02', 20, 15) },
    ];
    const pairs = pairSupplementLogs(prev, curr, 4);
    assert.equal(pairs.filter((p) => p.kind === 'same').length, 2);
  });

  it('prevCalendarDay', () => {
    assert.equal(prevCalendarDay('2026-06-03'), '2026-06-02');
  });

  it('collectSupplementLogs ignores skipped entries', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 0), qty: 0, sk: true },
      { id: '2', sid: 'sch-b', dt: isoLocal('2026-06-01', 10, 5), qty: 2, sk: false },
    ];
    const logs = collectSupplementLogs(S, '2026-06-01', 'mag1');
    assert.equal(logs.length, 1);
    assert.equal(logs[0].qty, 2);
  });

  it('split dose same daily total produces no row (1x2 yesterday, 2x1 today)', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 9, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-b', dt: isoLocal('2026-06-02', 7, 50), qty: 1, sk: false },
      { id: '3', sid: 'sch-o', dt: isoLocal('2026-06-02', 8, 30), qty: 1, sk: false },
    ];
    const rows = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.equal(rows.length, 0);
  });

  it('two logs yesterday and two today same qty different times produces no row', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 9, 0), qty: 1, sk: false },
      { id: '2', sid: 'sch-o', dt: isoLocal('2026-06-01', 9, 15), qty: 1, sk: false },
      { id: '3', sid: 'sch-b', dt: isoLocal('2026-06-02', 7, 50), qty: 1, sk: false },
      { id: '4', sid: 'sch-o', dt: isoLocal('2026-06-02', 8, 30), qty: 1, sk: false },
    ];
    const rows = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.equal(rows.length, 0);
  });

  it('dropped dose still reports when daily total decreases', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-b', dt: isoLocal('2026-06-01', 9, 0), qty: 1, sk: false },
      { id: '2', sid: 'sch-o', dt: isoLocal('2026-06-01', 9, 15), qty: 1, sk: false },
      { id: '3', sid: 'sch-b', dt: isoLocal('2026-06-02', 8, 30), qty: 1, sk: false },
    ];
    const rows = diffSupplementMid(S, 'mag1', '2026-06-01', '2026-06-02', 4);
    assert.equal(rows.length, 1);
    assert.equal(rows[0].was, '1 capsule');
    assert.equal(rows[0].now, '—');
  });

  it('formatChangeLogTime uses 12h clock', () => {
    const t = formatChangeLogTime(isoLocal('2026-06-01', 10, 4), '2026-06-01');
    assert.match(t, /Jun 1 10:04a/);
  });

  it('buildChangeReport sorts by date then time', () => {
    const S = stateWithMagnesium();
    S.sl = [
      { id: '1', sid: 'sch-o', dt: isoLocal('2026-06-01', 20, 0), qty: 2, sk: false },
      { id: '2', sid: 'sch-b', dt: isoLocal('2026-06-02', 8, 0), qty: 1, sk: false },
      { id: '3', sid: 'sch-b', dt: isoLocal('2026-06-03', 10, 0), qty: 2, sk: false },
      { id: '4', sid: 'sch-o', dt: isoLocal('2026-06-03', 7, 0), qty: 2, sk: false },
    ];
    const rows = buildChangeReport(S, '2026-06-02', '2026-06-03', 4);
    assert.ok(rows.length >= 2);
    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1];
      const cur = rows[i];
      const dateCmp = prev.date.localeCompare(cur.date);
      assert.ok(dateCmp <= 0, 'dates should be ascending');
      if (prev.date === cur.date) {
        assert.ok((prev.sortAt ?? 0) <= (cur.sortAt ?? 0), 'times should be ascending within a day');
      }
    }
  });
});
