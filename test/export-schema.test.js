import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  exportFieldKey,
  normalizeActivityExport,
  pruneExportPayload,
  tabVisibleForExport,
} from '../src/domain/export-schema.js';
import { buildCardActivityFlds, actListCardProfile } from '../src/domain/activity-field.js';

describe('exportFieldKey', () => {
  it('maps name and unit to snake key', () => {
    assert.equal(exportFieldKey({ nm: 'Duration', u: 'minutes' }), 'duration_min');
    assert.equal(exportFieldKey({ nm: 'Temperature', u: 'F' }), 'temperature_f');
  });
});

describe('normalizeActivityExport', () => {
  const act = {
    flds: [
      { nm: 'Activity', t: 'opts', opts: [{ v: 'Pool Plunge', defaults: { Duration: '5:30' } }] },
      { nm: 'Duration', t: 'number', u: 'minutes', step: ':30' },
      { nm: 'Temperature', t: 'number', u: 'F' },
    ],
  };

  it('flattens flds with normalized keys', () => {
    const out = normalizeActivityExport(
      { Activity: 'Pool Plunge', Duration: '5:30', Temperature: 55 },
      act
    );
    assert.equal(out.activity, 'Pool Plunge');
    assert.equal(out.duration_min, '5:30');
    assert.equal(out.temperature_f, 55);
    assert.equal(out.fields, undefined);
  });
});

describe('buildCardActivityFlds field def', () => {
  it('uses field-level def when option has no defaults', () => {
    const a = {
      inline: true,
      flds: [
        {
          nm: 'Activity',
          t: 'opts',
          opts: [{ v: 'Pool Plunge' }],
        },
        { nm: 'Duration', t: 'number', u: 'minutes', def: 5 },
      ],
    };
    const profile = actListCardProfile(a);
    const flds = buildCardActivityFlds(profile, { fieldNm: 'Activity', val: 'Pool Plunge' });
    assert.equal(flds.Duration, 5);
  });
});

describe('pruneExportPayload', () => {
  it('drops empty subjective block and empty arrays', () => {
    const out = pruneExportPayload({
      date: '2026-05-20',
      water_logged: [],
      lifestyle_protocols: [{ type: 'Sauna', duration_min: 15 }],
    });
    assert.equal(out.water_logged, undefined);
    assert.equal(out.subjective_scores, undefined);
  });
});

describe('tabVisibleForExport', () => {
  it('respects tab config', () => {
    assert.equal(tabVisibleForExport({ water: false, food: true }, 'water'), false);
    assert.equal(tabVisibleForExport({ water: false, food: true }, 'food'), true);
  });
});
