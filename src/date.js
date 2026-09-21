const DATE_FMT = new Intl.DateTimeFormat('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function isDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function formatDate(date) {
  return DATE_FMT.format(date);
}

export function todayDateString(timezone) {
  const date = new Date();
  if (!timezone) {
    return formatDate(date);
  }

  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return fmt.format(date);
}

export function parseDate(dateStr) {
  if (!isDateString(dateStr)) {
    throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD`);
  }
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function addDays(dateStr, days) {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

export function dayOfWeek(dateStr) {
  return parseDate(dateStr).getUTCDay();
}

export function diffDays(startDateStr, endDateStr) {
  const ms = parseDate(endDateStr).getTime() - parseDate(startDateStr).getTime();
  return Math.floor(ms / (24 * 60 * 60 * 1000));
}

export function compareDateStr(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}
