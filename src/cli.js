#!/usr/bin/env node
import { createHabitService, defaultDataFilePath } from './habitService.js';

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const positionals = [];
  const flags = {};

  for (const token of rest) {
    if (token.startsWith('--')) {
      const [key, value = 'true'] = token.slice(2).split('=');
      flags[key] = value;
    } else {
      positionals.push(token);
    }
  }

  return { command, positionals, flags };
}

function printHelp() {
  console.log(`Habit Tracker CLI

Commands:
  add <name> [--description=TEXT] [--schedule=daily|weekly:1,3,5|custom:3[:YYYY-MM-DD]] [--reminder=HH:MM]
  list
  complete <habitId> [--date=YYYY-MM-DD] [--note=TEXT]
  history <habitId>
  edit <habitId> [--name=TEXT] [--description=TEXT] [--schedule=SPEC] [--reminder=HH:MM|off]
  delete <habitId>
  due [--date=YYYY-MM-DD]
  set-reminder <HH:MM|off>
  set-quiet-hours <HH:MM-HH:MM|off>
  settings
  help
`);
}

function renderHabit(habit) {
  const due = habit.dueToday ? 'due' : 'not-due';
  const done = habit.completedToday ? 'done' : 'open';
  return `${habit.id} | ${habit.name} | ${due}/${done} | streak:${habit.streak.current} (best:${habit.streak.longest})`;
}

async function main() {
  const { command, positionals, flags } = parseArgs(process.argv.slice(2));
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const svc = createHabitService({ filePath: defaultDataFilePath(), timezone });

  try {
    switch (command) {
      case 'add': {
        const name = positionals.join(' ');
        const habit = svc.createHabit({
          name,
          description: flags.description || '',
          scheduleSpec: flags.schedule || 'daily',
          reminderTime: flags.reminder || svc.getSettings().defaultReminderTime,
        });
        console.log(`Created: ${habit.id}`);
        break;
      }
      case 'list': {
        const habits = svc.listHabits();
        if (!habits.length) {
          console.log('No habits yet. Use: habit add <name>');
          break;
        }
        habits.forEach((habit) => console.log(renderHabit(habit)));
        break;
      }
      case 'complete': {
        const [habitId] = positionals;
        const result = svc.completeHabit({ habitId, date: flags.date, note: flags.note });
        console.log(result.created ? 'Logged completion.' : 'Completion already logged for this day.');
        break;
      }
      case 'history': {
        const [habitId] = positionals;
        const entries = svc.getHistory(habitId);
        if (!entries.length) {
          console.log('No completions yet.');
          break;
        }
        entries.forEach((entry) => {
          console.log(`${entry.date}${entry.note ? ` | ${entry.note}` : ''}`);
        });
        break;
      }
      case 'edit': {
        const [habitId] = positionals;
        const reminder = flags.reminder === 'off' ? null : flags.reminder;
        const habit = svc.updateHabit(habitId, {
          name: flags.name,
          description: flags.description,
          scheduleSpec: flags.schedule,
          reminderTime: flags.reminder !== undefined ? reminder : undefined,
        });
        console.log(`Updated: ${habit.id}`);
        break;
      }
      case 'delete': {
        const [habitId] = positionals;
        const habit = svc.deleteHabit(habitId);
        console.log(`Archived: ${habit.id}`);
        break;
      }
      case 'due': {
        const due = svc.getDueHabits(flags.date);
        if (!due.length) {
          console.log('No due habits.');
          break;
        }
        due.forEach((habit) => console.log(renderHabit(habit)));
        break;
      }
      case 'set-reminder': {
        const [value] = positionals;
        const settings = svc.setDefaultReminder(value === 'off' ? null : value);
        console.log(`Default reminder: ${settings.defaultReminderTime || 'off'}`);
        break;
      }
      case 'set-quiet-hours': {
        const [value] = positionals;
        const settings = svc.setQuietHours(value === 'off' ? null : value);
        console.log(
          `Quiet hours: ${settings.quietHours ? `${settings.quietHours.start}-${settings.quietHours.end}` : 'off'}`
        );
        break;
      }
      case 'settings': {
        const settings = svc.getSettings();
        console.log(JSON.stringify(settings, null, 2));
        break;
      }
      case 'help':
      case undefined:
        printHelp();
        break;
      default:
        throw new Error(`Unknown command: ${command}`);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

main();
