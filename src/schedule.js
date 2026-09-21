import { dayOfWeek, diffDays, isDateString } from './date.js';

export function normalizeSchedule(schedule, createdAtDate) {
  if (!schedule || typeof schedule !== 'object') {
    throw new Error('Schedule is required');
  }

  if (schedule.type === 'daily') {
    return { type: 'daily' };
  }

  if (schedule.type === 'weekly') {
    const rawDays = Array.isArray(schedule.days) ? schedule.days : [];
    const normalized = [...new Set(rawDays.map(Number))].sort((a, b) => a - b);

    if (!normalized.length || normalized.some((d) => Number.isNaN(d) || d < 0 || d > 6)) {
      throw new Error('Weekly schedule requires days in range 0-6');
    }

    return { type: 'weekly', days: normalized };
  }

  if (schedule.type === 'custom') {
    const intervalDays = Number(schedule.intervalDays);
    if (!Number.isInteger(intervalDays) || intervalDays < 1) {
      throw new Error('Custom schedule requires intervalDays >= 1');
    }

    const anchorDate = schedule.anchorDate || createdAtDate;
    if (!isDateString(anchorDate)) {
      throw new Error('Custom schedule requires anchorDate in YYYY-MM-DD format');
    }

    return {
      type: 'custom',
      intervalDays,
      anchorDate,
    };
  }

  throw new Error(`Unsupported schedule type: ${schedule.type}`);
}

export function isDueOnDate(schedule, dateStr) {
  if (schedule.type === 'daily') {
    return true;
  }

  if (schedule.type === 'weekly') {
    return schedule.days.includes(dayOfWeek(dateStr));
  }

  if (schedule.type === 'custom') {
    const diff = diffDays(schedule.anchorDate, dateStr);
    return diff >= 0 && diff % schedule.intervalDays === 0;
  }

  return false;
}
