import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  prepareGlobalSave,
  rollbackGlobalSave,
  clearStagingAfterSave,
  resetAfterSave,
  emptyStaging,
} from '../src/session/save.js';
import { gTFQ, gDFQ } from '../src/domain/food.js';

describe('prepareGlobalSave', () => {
  it('bumps flSave and clears gdt', () => {
    const state = {
      gdt: '2026-05-17T10:00:00.000Z',
      flSave: null,
      fl: [
        {
          id: '1',
          fid: 'f1',
          dt: '2026-05-18T12:00:00.000Z',
          la: '2026-05-18T12:00:00.000Z',
          qty: 2,
          nt: '',
        },
      ],
    };
    const logDay = '2026-05-18T19:00:00.000Z';
    const snap = prepareGlobalSave(state, logDay);
    assert.equal(state.gdt, null);
    assert.ok(state.flSave);
    assert.equal(gTFQ(state, 'f1'), 0);
    // Daily total uses log day; after Save gdt is null so pin log day for assertion
    assert.equal(gDFQ({ ...state, gdt: logDay }, 'f1'), 2);
    rollbackGlobalSave(state, snap);
    assert.equal(state.gdt, '2026-05-17T10:00:00.000Z');
    assert.equal(state.flSave, null);
  });
});

describe('clearStagingAfterSave', () => {
  it('empties all staging maps', () => {
    const staging = {
      supSt: { sc1: { qty: 1 } },
      supAdhoc: { mid1: { qty: 2 } },
      otherSt: { a1: { fieldNm: 'x', val: 'y' } },
      pendingWater: { sid: 'sc1', qty: 8 },
    };
    clearStagingAfterSave(staging);
    assert.deepEqual(staging, emptyStaging());
  });
});

describe('resetAfterSave', () => {
  it('clears note fields and note-dirty class', () => {
    const removed = [];
    const mk = (val) => ({
      value: val,
      classList: { remove: (c) => removed.push(c) },
    });
    const els = {
      noteQuick: mk('hello'),
      foodNoteQuick: mk('food'),
      suppNoteQuick: mk(''),
    };
    resetAfterSave((id) => (id === 'suppNoteQuick' ? null : els[id] || null));
    assert.equal(els.noteQuick.value, '');
    assert.equal(els.foodNoteQuick.value, '');
    assert.equal(removed.filter((c) => c === 'note-dirty').length, 2);
  });
});

describe('successful save sequence', () => {
  it('session reset, counters preserved, staging cleared', () => {
    const state = {
      gdt: '2026-05-18T08:00:00.000Z',
      flSave: null,
      fl: [
        {
          id: '1',
          fid: 'f1',
          dt: '2026-05-18T12:00:00.000Z',
          la: '2026-05-18T12:00:00.000Z',
          qty: 1.5,
          nt: '',
        },
      ],
    };
    const staging = {
      supSt: { sid1: { qty: 1, nt: '', sk: false } },
      supAdhoc: {},
      otherSt: {},
      pendingWater: null,
    };
    const logDay = '2026-05-18T19:00:00.000Z';
    const snap = prepareGlobalSave(state, logDay);
    const dailyBefore = gDFQ({ ...state, gdt: logDay }, 'f1');
    clearStagingAfterSave(staging);
    assert.equal(gTFQ(state, 'f1'), 0);
    assert.equal(gDFQ({ ...state, gdt: logDay }, 'f1'), dailyBefore);
    assert.deepEqual(staging.supSt, {});
    assert.equal(state.gdt, null);
    assert.equal(snap.prevGdt, '2026-05-18T08:00:00.000Z');
  });
});
