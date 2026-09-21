import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateStreakSummary } from '../src/streak.js';

test('current and longest streak for daily habit', () => {
  const habit = {
    id: 'h1',
    createdDate: '2026-01-01',
    schedule: { type: 'daily' },
  };

  const entries = [
    { habitId: 'h1', date: '2026-01-01' },
    { habitId: 'h1', date: '2026-01-02' },
    { habitId: 'h1', date: '2026-01-04' },
    { habitId: 'h1', date: '2026-01-05' },
    { habitId: 'h1', date: '2026-01-06' },
  ];

  const summary = calculateStreakSummary(habit, entries, '2026-01-06');
  assert.equal(summary.current, 3);
  assert.equal(summary.longest, 3);
});

test('7-day progress does not count days before habit creation', () => {
  const habit = {
    id: 'h2',
    createdDate: '2026-01-06',
    schedule: { type: 'daily' },
  };

  const summary = calculateStreakSummary(habit, [], '2026-01-06');
  assert.equal(summary.dueLast7, 1);
  assert.equal(summary.completedLast7, 0);
});
