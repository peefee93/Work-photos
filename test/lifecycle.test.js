import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { createHabitService } from '../src/habitService.js';

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-test-'));
  return path.join(dir, 'habits.json');
}

test('habit lifecycle and idempotent completion', () => {
  const svc = createHabitService({
    filePath: tempFile(),
    timezone: 'UTC',
  });

  const habit = svc.createHabit({
    name: 'Upload work photo',
    scheduleSpec: 'daily',
    reminderTime: '09:00',
  });

  let habits = svc.listHabits({ asOfDate: habit.createdDate });
  assert.equal(habits.length, 1);
  assert.equal(habits[0].dueToday, true);

  const first = svc.completeHabit({ habitId: habit.id, date: habit.createdDate });
  const second = svc.completeHabit({ habitId: habit.id, date: habit.createdDate });

  assert.equal(first.created, true);
  assert.equal(second.created, false);

  const history = svc.getHistory(habit.id);
  assert.equal(history.length, 1);

  svc.updateHabit(habit.id, { scheduleSpec: 'weekly:1,3,5' });
  habits = svc.listHabits({ asOfDate: habit.createdDate });
  assert.equal(habits[0].schedule.type, 'weekly');

  const archived = svc.deleteHabit(habit.id);
  assert.equal(archived.archived, true);
  assert.equal(svc.listHabits().length, 0);
});
