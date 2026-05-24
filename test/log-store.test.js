import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  listLogs,
  filterByDay,
  removeLogIds,
  combinedTrackerLogText,
  getLog,
  updateLogDt,
  arraysForType,
} from '../src/domain/log-store.js';

function isoToLocalYMD(iso) {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

describe('log-store', () => {
  const state = {
    wl: [{ id: 'w1', dt: '2026-05-18T12:00:00.000Z', qty: 8 }],
    sl: [{ id: 's1', dt: '2026-05-19T12:00:00.000Z', sid: 'x' }],
    snotes: [{ id: 'sn1', dt: '2026-05-19T14:00:00.000Z', bd: 'note' }],
    al: [],
    fl: [],
    notes: [],
    fnotes: [],
  };

  it('lists water entries', () => {
    assert.equal(listLogs(state, 'water', {}, isoToLocalYMD).length, 1);
  });

  it('filters by day', () => {
    const day = isoToLocalYMD('2026-05-18T12:00:00.000Z');
    assert.equal(listLogs(state, 'water', { day }, isoToLocalYMD).length, 1);
    assert.equal(listLogs(state, 'water', { day: '2026-05-19' }, isoToLocalYMD).length, 0);
  });

  it('sorts newest first by default', () => {
    const rows = listLogs(state, 'supps', {}, isoToLocalYMD);
    assert.equal(rows[0].id, 'sn1');
    assert.equal(rows[1].id, 's1');
  });

  it('getLog finds entry in supps notes or logs', () => {
    assert.equal(getLog(state, 'supps', 's1')?.sid, 'x');
    assert.equal(getLog(state, 'supps', 'sn1')?.bd, 'note');
    assert.equal(getLog(state, 'supps', 'missing'), null);
  });

  it('updateLogDt changes dt for selected ids in type scope', () => {
    const s = JSON.parse(JSON.stringify(state));
    const n = updateLogDt(s, 'supps', ['s1'], '2026-05-20T08:00:00.000Z');
    assert.equal(n, 1);
    assert.equal(s.sl[0].dt, '2026-05-20T08:00:00.000Z');
    assert.equal(s.snotes[0].dt, '2026-05-19T14:00:00.000Z');
  });

  it('removes by id', () => {
    const s = { wl: [{ id: 'w1' }, { id: 'w2' }] };
    removeLogIds(s, 'water', ['w1']);
    assert.deepEqual(s.wl.map((x) => x.id), ['w2']);
  });

  it('arraysForType covers supps arrays', () => {
    assert.equal(arraysForType(state, 'supps').length, 2);
  });

  it('combinedTrackerLogText joins days', () => {
    const text = combinedTrackerLogText(['2026-05-18', '2026-05-19'], (d) => `# ${d}`);
    assert.match(text, /# 2026-05-18/);
    assert.match(text, /# 2026-05-19/);
  });
});
