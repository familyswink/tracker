import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { gDFQ, gTFQ, bumpFlSave } from '../src/domain/food.js';
import { isoToLocalYMD } from '../src/core/date.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixture = JSON.parse(readFileSync(join(__dirname, 'fixtures/food-state.json'), 'utf8'));

function cloneState() {
  return JSON.parse(JSON.stringify(fixture));
}

describe('gDFQ vs gTFQ', () => {
  it('daily total includes all entries on log day', () => {
    const state = cloneState();
    state.gdt = '2026-05-18T12:00:00.000Z';
    assert.equal(gDFQ(state, 'f1'), 3);
    assert.equal(gDFQ(state, 'f2'), 0);
  });

  it('when flSave is null, session matches daily on log day', () => {
    const state = cloneState();
    state.gdt = '2026-05-18T12:00:00.000Z';
    assert.equal(state.flSave, null);
    assert.equal(gTFQ(state, 'f1'), 3);
    assert.equal(gDFQ(state, 'f1'), 3);
  });

  it('after bumpFlSave, session hides prior entries but daily keeps total', () => {
    const state = cloneState();
    state.gdt = '2026-05-18T12:00:00.000Z';
    bumpFlSave(state, '2026-05-18T19:00:00.000Z');
    assert.equal(gTFQ(state, 'f1'), 0);
    assert.equal(gDFQ(state, 'f1'), 3);
  });

  it('new entries after flSave appear in session only', () => {
    const state = cloneState();
    state.gdt = '2026-05-18T12:00:00.000Z';
    bumpFlSave(state, '2026-05-18T19:00:00.000Z');
    state.fl.push({
      id: 'new',
      fid: 'f1',
      dt: '2026-05-18T20:00:00.000Z',
      la: '2026-05-18T20:00:00.000Z',
      qty: 0.5,
      nt: '',
    });
    assert.equal(gTFQ(state, 'f1'), 0.5);
    assert.equal(gDFQ(state, 'f1'), 3.5);
  });
});

describe('bumpFlSave', () => {
  it('sets flSave 1ms after save timestamp', () => {
    const state = { flSave: null };
    const ts = '2026-05-18T12:00:00.000Z';
    bumpFlSave(state, ts);
    assert.equal(new Date(state.flSave).getTime(), new Date(ts).getTime() + 1);
  });

  it('excludes entries logged at saveTs from session (la < flSave)', () => {
    const state = {
      gdt: '2026-05-18T12:00:00.000Z',
      flSave: null,
      fl: [
        {
          id: 'x',
          fid: 'f1',
          dt: '2026-05-18T12:00:00.000Z',
          la: '2026-05-18T12:00:00.000Z',
          qty: 2,
          nt: '',
        },
      ],
    };
    bumpFlSave(state, '2026-05-18T12:00:00.000Z');
    assert.equal(gTFQ(state, 'f1'), 0);
    assert.equal(gDFQ(state, 'f1'), 2);
  });
});

describe('log day alignment', () => {
  it('filters by isoToLocalYMD(dt), not UTC slice', () => {
    const state = {
      gdt: '2026-05-18T23:30:00.000Z',
      flSave: null,
      fl: [
        {
          id: 'e1',
          fid: 'f1',
          dt: '2026-05-19T04:30:00.000Z',
          la: '2026-05-19T04:30:00.000Z',
          qty: 1,
          nt: '',
        },
      ],
    };
    const logDay = isoToLocalYMD(state.gdt);
    const entryDay = isoToLocalYMD(state.fl[0].dt);
    if (logDay === entryDay) {
      assert.equal(gDFQ(state, 'f1'), 1);
    } else {
      assert.equal(gDFQ(state, 'f1'), 0);
    }
  });
});
