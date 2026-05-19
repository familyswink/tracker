import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isoToLocalYMD,
  dateAndTimeToISO,
  logEntryDay,
  matchesLogDay,
  localDateYMD,
} from '../src/core/date.js';

describe('isoToLocalYMD', () => {
  it('returns date-only strings unchanged', () => {
    assert.equal(isoToLocalYMD('2026-05-18'), '2026-05-18');
  });

  it('uses local calendar day, not UTC slice', () => {
    const tz = process.env.TZ || '';
    const ymd = isoToLocalYMD('2026-05-19T04:00:00.000Z');
    if (tz === 'America/Chicago') {
      assert.equal(ymd, '2026-05-18');
    } else if (tz === 'UTC') {
      assert.equal(ymd, '2026-05-19');
    } else {
      assert.notEqual(ymd, '2026-05-19T04:00:00.000Z'.slice(0, 10));
      assert.match(ymd, /^\d{4}-\d{2}-\d{2}$/);
    }
  });
});

describe('dateAndTimeToISO', () => {
  it('round-trips local wall time in current timezone', () => {
    const iso = dateAndTimeToISO('2026-05-18', '14:30');
    const d = new Date(iso);
    assert.equal(localDateYMD(d), '2026-05-18');
    assert.equal(d.getHours(), 14);
    assert.equal(d.getMinutes(), 30);
  });

  it('defaults time to 12:00 when omitted', () => {
    const iso = dateAndTimeToISO('2026-06-01', '');
    const d = new Date(iso);
    assert.equal(d.getHours(), 12);
    assert.equal(d.getMinutes(), 0);
  });
});

describe('logEntryDay', () => {
  it('uses dt for day bucket', () => {
    assert.equal(
      logEntryDay({ dt: '2026-05-18T20:00:00.000Z', la: '2026-05-19T04:00:00.000Z' }),
      isoToLocalYMD('2026-05-18T20:00:00.000Z')
    );
  });
});

describe('matchesLogDay', () => {
  it('matches same local day across ISO strings', () => {
    const a = dateAndTimeToISO('2026-05-18', '08:00');
    const b = dateAndTimeToISO('2026-05-18', '20:00');
    assert.equal(matchesLogDay(a, b), true);
  });

  it('rejects different local days', () => {
    const a = dateAndTimeToISO('2026-05-18', '12:00');
    const b = dateAndTimeToISO('2026-05-17', '12:00');
    assert.equal(matchesLogDay(a, b), false);
  });
});
