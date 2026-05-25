import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  numberFieldSpec,
  shouldUseNumberSelect,
  buildCardActivityFlds,
  defaultsFromFirstOpt,
  actListCardProfile,
  parseStepSpec,
  isColonStepField,
  colonSelectOptions,
  formatFieldDefaultValue,
  secondsToMmSs,
  minutesToHourMin,
  stepFieldHelpText,
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

describe('colon step fields', () => {
  const minField = { t: 'number', u: 'minutes', min: 0, max: 10, step: ':30' };
  const hrField = { t: 'number', u: 'hours', min: 0, max: 3, step: ':15' };

  it('parseStepSpec detects minute-second colon steps', () => {
    const s = parseStepSpec(':30', 'minutes');
    assert.equal(s.mode, 'colon');
    assert.equal(s.colonKind, 'minute_seconds');
    assert.equal(s.step, 30);
  });

  it('parseStepSpec detects hour-minute colon steps', () => {
    const s = parseStepSpec(':15', 'hours');
    assert.equal(s.mode, 'colon');
    assert.equal(s.colonKind, 'hour_minutes');
    assert.equal(s.step, 15);
  });

  it('colonSelectOptions for minutes uses M:SS labels', () => {
    const opts = colonSelectOptions(minField);
    assert.ok(opts.length >= 2);
    assert.equal(opts[0].value, '0:00');
    assert.equal(opts[1].value, '0:30');
  });

  it('colonSelectOptions for hours uses H:MM labels', () => {
    const opts = colonSelectOptions(hrField);
    assert.ok(opts.length >= 2);
    assert.equal(opts[0].value, '0:00');
    assert.equal(opts[1].value, '0:15');
  });

  it('formatFieldDefaultValue preserves colon strings', () => {
    assert.equal(formatFieldDefaultValue(minField, '5:30'), '5:30');
    assert.equal(formatFieldDefaultValue(hrField, '1:30'), '1:30');
  });

  it('shouldUseNumberSelect true for colon fields with bounded options', () => {
    const spec = numberFieldSpec(minField);
    assert.equal(isColonStepField(minField), true);
    assert.equal(shouldUseNumberSelect(spec, minField), true);
  });

  it('stepFieldHelpText varies by unit', () => {
    assert.match(stepFieldHelpText('minutes'), /30-second/);
    assert.match(stepFieldHelpText('hours'), /15-minute/);
  });

  it('buildCardActivityFlds formats colon defaults', () => {
    const a = {
      inline: true,
      flds: [
        { nm: 'Activity', t: 'opts', opts: [{ v: 'Run', defaults: { Duration: '5:30' } }] },
        { nm: 'Duration', t: 'number', u: 'minutes', step: ':30', def: null },
      ],
    };
    const profile = actListCardProfile(a);
    const flds = buildCardActivityFlds(profile, { fieldNm: 'Activity', val: 'Run' });
    assert.equal(flds.Duration, '5:30');
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
