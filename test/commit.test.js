import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { commitGlobalSave } from '../src/session/commit.js';
import { gTFQ, gDFQ } from '../src/domain/food.js';

describe('commitGlobalSave', () => {
  it('rolls back flSave, gdt, and staged rows when persist fails', async () => {
    const state = {
      gdt: '2026-05-18T08:00:00.000Z',
      flSave: null,
      fl: [
        {
          id: '1',
          fid: 'f1',
          dt: '2026-05-18T12:00:00.000Z',
          la: '2026-05-18T12:00:00.000Z',
          qty: 2,
        },
      ],
      wl: [],
      sl: [{ id: 's1', sid: 'sc1', dt: '2026-05-18T12:00:00.000Z', qty: 1 }],
      al: [],
    };
    const staging = { supSt: { x: 1 }, supAdhoc: {}, otherSt: {}, pendingWater: null };
    const logDay = '2026-05-18T19:00:00.000Z';
    let rolled = false;

    const result = await commitGlobalSave({
      state,
      staging,
      commitStaged: () => ({
        addedWl: [],
        addedSl: ['s-new'],
        addedAL: [],
        batchDay: '2026-05-18',
        hadCommits: true,
      }),
      persist: () => false,
      rollbackStaged: (staged) => {
        rolled = true;
        state.sl = state.sl.filter((e) => e.id !== 's-new');
        assert.equal(staged.addedSl.length, 1);
      },
      resetUi: () => {
        throw new Error('resetUi must not run on failed persist');
      },
    });

    assert.equal(result.ok, false);
    assert.equal(rolled, true);
    assert.equal(state.gdt, '2026-05-18T08:00:00.000Z');
    assert.equal(state.flSave, null);
    assert.equal(gTFQ(state, 'f1'), 2);
    assert.equal(gDFQ({ ...state, gdt: logDay }, 'f1'), 2);
    assert.deepEqual(staging.supSt, { x: 1 });
  });

  it('clears staging and bumps flSave on success', async () => {
    const state = {
      gdt: '2026-05-18T08:00:00.000Z',
      flSave: null,
      fl: [
        {
          id: '1',
          fid: 'f1',
          dt: '2026-05-18T12:00:00.000Z',
          la: '2026-05-18T12:00:00.000Z',
          qty: 1,
        },
      ],
      wl: [],
      sl: [],
      al: [],
    };
    const staging = {
      supSt: { sid: { qty: 1 } },
      supAdhoc: { mid: { qty: 2 } },
      otherSt: { aid: { fieldNm: 'x', val: 'y' } },
      pendingWater: { qty: 8 },
    };
    const logDay = '2026-05-18T19:00:00.000Z';
    let uiReset = false;
    let after = false;

    const result = await commitGlobalSave({
      state,
      staging,
      flushQuickNotes: () => {},
      commitStaged: () => ({
        addedWl: [],
        addedSl: [],
        addedAL: [],
        batchDay: '2026-05-18',
        hadCommits: false,
      }),
      persist: () => true,
      resetUi: () => {
        uiReset = true;
      },
      afterSuccess: async () => {
        after = true;
      },
    });

    assert.equal(result.ok, true);
    assert.equal(uiReset, true);
    assert.equal(after, true);
    assert.equal(state.gdt, null);
    assert.ok(state.flSave);
    assert.equal(gTFQ(state, 'f1'), 0);
    assert.equal(gDFQ({ ...state, gdt: logDay }, 'f1'), 1);
    assert.deepEqual(staging.supSt, {});
    assert.deepEqual(staging.supAdhoc, {});
    assert.deepEqual(staging.otherSt, {});
    assert.equal(staging.pendingWater, null);
  });
});
