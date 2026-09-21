import test from 'node:test';
import assert from 'node:assert/strict';
import { isDueOnDate, normalizeSchedule } from '../src/schedule.js';

test('daily schedule is always due', () => {
  const schedule = normalizeSchedule({ type: 'daily' }, '2026-01-01');
  assert.equal(isDueOnDate(schedule, '2026-01-01'), true);
  assert.equal(isDueOnDate(schedule, '2026-01-05'), true);
});

test('weekly schedule due only on matching weekdays', () => {
  const schedule = normalizeSchedule({ type: 'weekly', days: [1, 3, 5] }, '2026-01-01');
  assert.equal(isDueOnDate(schedule, '2026-01-05'), true); // Monday
  assert.equal(isDueOnDate(schedule, '2026-01-06'), false); // Tuesday
});

test('custom schedule interval respects anchor date', () => {
  const schedule = normalizeSchedule({ type: 'custom', intervalDays: 2, anchorDate: '2026-01-01' }, '2026-01-01');
  assert.equal(isDueOnDate(schedule, '2026-01-01'), true);
  assert.equal(isDueOnDate(schedule, '2026-01-02'), false);
  assert.equal(isDueOnDate(schedule, '2026-01-03'), true);
});
