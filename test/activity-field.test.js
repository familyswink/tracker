import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  numberFieldSpec,
  shouldUseNumberSelect,
  buildCardActivityFlds,
  defaultsFromFirstOpt,
  actListCardProfile,
} from '../src/domain/activity-field.js';

describe('numberFieldSpec', () => {
  it('reads min/max/step/def from field schema', () => {
    const s = numberFieldSpec({ t: 'number', min: 0, max: 120, step: 1, def: 55 });
    assert.equal(s.min, 0);
    assert.equal(s.max, 120);
    assert.equal(s.def, 55);
  });
  it('def null stays null', () => {
    assert.equal(numberFieldSpec({ t: 'number', def: null }).def, null);
  });
});

describe('shouldUseNumberSelect', () => {
  it('allows bounded select up to 300 options', () => {
    assert.equal(shouldUseNumberSelect({ min: 0, max: 10, step: 1 }), true);
    assert.equal(shouldUseNumberSelect({ min: 0, max: 500, step: 1 }), false);
  });
});

describe('card Save flds', () => {
  const a = {
    inline: true,
    flds: [
      {
        nm: 'Activity',
        t: 'opts',
        multi: true,
        opts: [
          { v: 'Sauna', defaults: { Duration: 15, Temperature: 170 } },
          { v: 'Cold Plunge', defaults: { Duration: 5, Temperature: 45 } },
        ],
      },
      { nm: 'Duration', t: 'number', u: 'minutes', def: null },
      { nm: 'Temperature', t: 'number', u: 'F', def: null },
    ],
  };

  it('multi-select uses first opt defaults', () => {
    const profile = actListCardProfile(a);
    const flds = buildCardActivityFlds(profile, {
      fieldNm: 'Activity',
      multi: true,
      vals: ['Cold Plunge', 'Sauna'],
    });
    assert.deepEqual(flds.Activity, ['Cold Plunge', 'Sauna']);
    assert.equal(flds.Duration, 5);
    assert.equal(flds.Temperature, 45);
  });

  it('omits null default fields', () => {
    const profile = actListCardProfile({
      inline: true,
      flds: [
        { nm: 'Pick', t: 'opts', opts: [{ v: 'A', defaults: { Duration: 10 } }] },
        { nm: 'Duration', t: 'number', def: null },
        { nm: 'Notes', t: 'text' },
      ],
    });
    const flds = buildCardActivityFlds(profile, { fieldNm: 'Pick', val: 'A' });
    assert.equal(flds.Duration, 10);
    assert.equal(flds.Notes, undefined);
  });

  it('defaultsFromFirstOpt picks first selected', () => {
    const lf = a.flds[0];
    assert.deepEqual(defaultsFromFirstOpt(lf, ['Sauna', 'Cold Plunge']), { Duration: 15, Temperature: 170 });
  });
});
