import { addDays, compareDateStr } from './date.js';
import { isDueOnDate } from './schedule.js';

function dueDatesBetween(schedule, startDate, endDate) {
  const due = [];
  let cursor = startDate;
  while (compareDateStr(cursor, endDate) <= 0) {
    if (isDueOnDate(schedule, cursor)) {
      due.push(cursor);
    }
    cursor = addDays(cursor, 1);
  }
  return due;
}

export function calculateStreakSummary(habit, entries, asOfDate) {
  const completedDates = new Set(
    entries
      .filter((entry) => entry.habitId === habit.id)
      .map((entry) => entry.date)
  );

  const dueDates = dueDatesBetween(habit.schedule, habit.createdDate, asOfDate);

  let current = 0;
  for (let i = dueDates.length - 1; i >= 0; i -= 1) {
    if (completedDates.has(dueDates[i])) {
      current += 1;
    } else {
      break;
    }
  }

  let longest = 0;
  let run = 0;
  for (const dueDate of dueDates) {
    if (completedDates.has(dueDate)) {
      run += 1;
      if (run > longest) {
        longest = run;
      }
    } else {
      run = 0;
    }
  }

  const lookbackStart = addDays(asOfDate, -6);
  const dueLast7 = dueDatesBetween(habit.schedule, lookbackStart, asOfDate);
  const completedLast7 = dueLast7.filter((d) => completedDates.has(d)).length;

  return {
    current,
    longest,
    dueLast7: dueLast7.length,
    completedLast7,
  };
}
