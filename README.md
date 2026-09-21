# Work-photos Habit Tracker

A single-user CLI habit tracker focused on daily check-ins, progress visibility, and schedule flexibility.

## Features
- Habit CRUD (create, list, edit, archive)
- Schedule cadence support:
  - `daily`
  - `weekly:<dayIndexes>` (0=Sun ... 6=Sat)
  - `custom:<intervalDays>[:anchorDate]`
- Completion logging with idempotency (no duplicate completion for same day)
- Streak and weekly progress summaries
- Habit history
- User settings:
  - default reminder time
  - quiet hours

## Requirements
- Node.js 20+

## Setup
```bash
npm install
```

## Usage
```bash
# Show help
npm run habit -- help

# Create habits
npm run habit -- add "Upload work photo" --schedule=daily --reminder=09:00
npm run habit -- add "Weekly gallery cleanup" --schedule=weekly:1,3,5
npm run habit -- add "Portfolio update" --schedule=custom:3:2026-09-21

# List habits and progress
npm run habit -- list

# Log completion
npm run habit -- complete <habitId>
npm run habit -- complete <habitId> --date=2026-09-21 --note="Finished before lunch"

# View history
npm run habit -- history <habitId>

# Update or archive
npm run habit -- edit <habitId> --name="Upload edited photo" --reminder=10:00
npm run habit -- delete <habitId>

# Show due habits
npm run habit -- due

# Global settings
npm run habit -- set-reminder 08:30
npm run habit -- set-quiet-hours 22:00-07:00
npm run habit -- settings
```

## Data model
Local JSON file (default: `.data/habits.json`) stores:
- `habits`: id, metadata, schedule, reminder
- `entries`: completion records (habitId + date)
- `userSettings`: timezone, default reminder, quiet hours

Override storage path:
```bash
HABIT_DATA_FILE=/absolute/path/habits.json npm run habit -- list
```

## Quality
Run all tests:
```bash
npm test
```

## Architecture
- `src/storage.js`: persistence layer
- `src/schedule.js`: schedule normalization and due evaluation
- `src/streak.js`: streak and progress calculations
- `src/habitService.js`: domain logic (CRUD, completion, settings)
- `src/cli.js`: user interaction layer

## Release checklist
- [ ] Run `npm test`
- [ ] Verify core CLI flows manually (`add`, `list`, `complete`, `history`, `edit`, `due`)
- [ ] Confirm reminder/quiet-hour settings are persisted
- [ ] Ensure no secrets are committed
