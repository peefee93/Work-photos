import fs from 'node:fs';
import path from 'node:path';

function defaultData(timezone) {
  return {
    version: 1,
    habits: [],
    entries: [],
    userSettings: {
      timezone,
      defaultReminderTime: null,
      quietHours: null,
    },
  };
}

export function createStorage(filePath, timezone) {
  function ensureDir() {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
  }

  function load() {
    if (!fs.existsSync(filePath)) {
      return defaultData(timezone);
    }
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return {
      ...defaultData(timezone),
      ...parsed,
      userSettings: {
        ...defaultData(timezone).userSettings,
        ...(parsed.userSettings || {}),
      },
    };
  }

  function save(data) {
    ensureDir();
    fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  }

  return { load, save };
}
