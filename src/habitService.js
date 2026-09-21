import path from 'node:path';
import { calculateStreakSummary } from './streak.js';
import { createStorage } from './storage.js';
import { isDueOnDate, normalizeSchedule } from './schedule.js';
import { isDateString, todayDateString } from './date.js';

function validateTime(text) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(text);
}

export function parseScheduleSpec(spec, createdDate) {
  if (!spec || spec === 'daily') {
    return { type: 'daily' };
  }

  if (spec.startsWith('weekly:')) {
    const days = spec
      .slice('weekly:'.length)
      .split(',')
      .map((d) => Number(d.trim()))
      .filter((n) => Number.isFinite(n));
    return normalizeSchedule({ type: 'weekly', days }, createdDate);
  }

  if (spec.startsWith('custom:')) {
    const [, intervalPart = '', anchorPart = ''] = spec.split(':');
    const intervalDays = Number(intervalPart);
    return normalizeSchedule(
      {
        type: 'custom',
        intervalDays,
        anchorDate: anchorPart || createdDate,
      },
      createdDate
    );
  }

  throw new Error('Invalid schedule spec. Use daily, weekly:1,3,5, or custom:3[:YYYY-MM-DD]');
}

export function createHabitService({ filePath, timezone }) {
  const store = createStorage(filePath, timezone);

  function nowDate() {
    return todayDateString(timezone);
  }

  function createHabit({ name, description = '', scheduleSpec = 'daily', reminderTime = null }) {
    if (!name || !name.trim()) {
      throw new Error('Habit name is required');
    }

    const data = store.load();
    const createdDate = nowDate();
    const schedule = parseScheduleSpec(scheduleSpec, createdDate);

    if (reminderTime && !validateTime(reminderTime)) {
      throw new Error('Reminder time must be HH:MM (24h)');
    }

    const id = `hbt_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
    const habit = {
      id,
      name: name.trim(),
      description: description.trim(),
      createdAt: new Date().toISOString(),
      createdDate,
      archived: false,
      schedule,
      reminder: reminderTime ? { enabled: true, time: reminderTime } : { enabled: false, time: null },
    };

    data.habits.push(habit);
    store.save(data);
    return habit;
  }

  function listHabits({ includeArchived = false, asOfDate } = {}) {
    const data = store.load();
    const date = asOfDate || nowDate();

    return data.habits
      .filter((habit) => includeArchived || !habit.archived)
      .map((habit) => {
        const streak = calculateStreakSummary(habit, data.entries, date);
        const completedToday = data.entries.some(
          (e) => e.habitId === habit.id && e.date === date
        );
        return {
          ...habit,
          dueToday: isDueOnDate(habit.schedule, date),
          completedToday,
          streak,
        };
      });
  }

  function getHabit(habitId) {
    const data = store.load();
    const habit = data.habits.find((h) => h.id === habitId);
    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }
    return habit;
  }

  function completeHabit({ habitId, date = nowDate(), note = '' }) {
    if (!isDateString(date)) {
      throw new Error('Completion date must be YYYY-MM-DD');
    }

    const data = store.load();
    const habit = data.habits.find((h) => h.id === habitId && !h.archived);
    if (!habit) {
      throw new Error(`Active habit not found: ${habitId}`);
    }

    const existing = data.entries.find((entry) => entry.habitId === habitId && entry.date === date);
    if (existing) {
      return { entry: existing, created: false };
    }

    const entry = {
      habitId,
      date,
      completedAt: new Date().toISOString(),
      note: note.trim() || null,
    };
    data.entries.push(entry);
    store.save(data);
    return { entry, created: true };
  }

  function getHistory(habitId) {
    getHabit(habitId);
    const data = store.load();
    return data.entries
      .filter((entry) => entry.habitId === habitId)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function deleteHabit(habitId) {
    const data = store.load();
    const habit = data.habits.find((h) => h.id === habitId);
    if (!habit) {
      throw new Error(`Habit not found: ${habitId}`);
    }
    habit.archived = true;
    store.save(data);
    return habit;
  }

  function updateHabit(habitId, updates) {
    const data = store.load();
    const habit = data.habits.find((h) => h.id === habitId && !h.archived);
    if (!habit) {
      throw new Error(`Active habit not found: ${habitId}`);
    }

    if (updates.name !== undefined) {
      if (!updates.name.trim()) {
        throw new Error('Habit name cannot be empty');
      }
      habit.name = updates.name.trim();
    }

    if (updates.description !== undefined) {
      habit.description = updates.description.trim();
    }

    if (updates.scheduleSpec !== undefined) {
      habit.schedule = parseScheduleSpec(updates.scheduleSpec, habit.createdDate);
    }

    if (updates.reminderTime !== undefined) {
      if (updates.reminderTime === null) {
        habit.reminder = { enabled: false, time: null };
      } else {
        if (!validateTime(updates.reminderTime)) {
          throw new Error('Reminder time must be HH:MM (24h)');
        }
        habit.reminder = { enabled: true, time: updates.reminderTime };
      }
    }

    store.save(data);
    return habit;
  }

  function setDefaultReminder(reminderTime) {
    const data = store.load();

    if (reminderTime === null) {
      data.userSettings.defaultReminderTime = null;
      store.save(data);
      return data.userSettings;
    }

    if (!validateTime(reminderTime)) {
      throw new Error('Reminder time must be HH:MM (24h)');
    }

    data.userSettings.defaultReminderTime = reminderTime;
    store.save(data);
    return data.userSettings;
  }

  function setQuietHours(quietHours) {
    const data = store.load();

    if (quietHours === null) {
      data.userSettings.quietHours = null;
      store.save(data);
      return data.userSettings;
    }

    if (!/^[0-2]\d:[0-5]\d-[0-2]\d:[0-5]\d$/.test(quietHours)) {
      throw new Error('Quiet hours must be in HH:MM-HH:MM format');
    }

    const [start, end] = quietHours.split('-');
    if (!validateTime(start) || !validateTime(end)) {
      throw new Error('Quiet hours must be valid 24h times');
    }

    data.userSettings.quietHours = { start, end };
    store.save(data);
    return data.userSettings;
  }

  function getDueHabits(date = nowDate()) {
    return listHabits({ asOfDate: date }).filter((habit) => habit.dueToday && !habit.completedToday);
  }

  function getSettings() {
    return store.load().userSettings;
  }

  return {
    createHabit,
    listHabits,
    getHabit,
    completeHabit,
    getHistory,
    deleteHabit,
    updateHabit,
    setDefaultReminder,
    setQuietHours,
    getDueHabits,
    getSettings,
  };
}

export function defaultDataFilePath() {
  return process.env.HABIT_DATA_FILE || path.resolve(process.cwd(), '.data', 'habits.json');
}
