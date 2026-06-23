import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  periodBoundaryExports,
  shouldCheckPeriodExports,
  datesInCalendarMonth,
} from '../src/domain/period-export.js';

describe('period-export', () => {
  it('shouldCheckPeriodExports on month boundary', () => {
    assert.equal(shouldCheckPeriodExports('2026-04-30', '2026-05-01'), true);
    assert.equal(shouldCheckPeriodExports('2026-05-01', '2026-05-02'), false);
  });

  it('periodBoundaryExports for first May save', () => {
    const jobs = periodBoundaryExports('2026-05-01', { months: [], quarters: [], years: [] });
    assert.ok(jobs.some((j) => j.filename === '2026_April.md'));
    assert.equal(jobs.find((j) => j.filename === '2026_April.md').dates.length, 30);
  });

  it('April dates count', () => {
    assert.equal(datesInCalendarMonth(2026, 4).length, 30);
  });

  it('January save exports prior year and quarter', () => {
    const jobs = periodBoundaryExports('2027-01-05', { months: [], quarters: [], years: [] });
    assert.ok(jobs.some((j) => j.filename === '2026_December.md'));
    assert.ok(jobs.some((j) => j.filename === '2026_Q4.md'));
    assert.ok(jobs.some((j) => j.filename === '2026.md'));
  });
});
