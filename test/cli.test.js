import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const repoRoot = path.resolve(import.meta.dirname, '..');
const cliPath = path.join(repoRoot, 'src', 'cli.js');

function tempFile() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'habit-cli-test-'));
  return path.join(dir, 'habits.json');
}

test('CLI preserves embedded equals signs in flag values', () => {
  const dataFile = tempFile();
  const env = {
    ...process.env,
    HABIT_DATA_FILE: dataFile,
    TZ: 'UTC',
  };

  const createdOutput = execFileSync(process.execPath, [cliPath, 'add', 'Upload work photo'], {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
  });
  const habitId = createdOutput.match(/Created: (\S+)/)?.[1];

  assert.ok(habitId, 'expected created habit id in CLI output');

  execFileSync(
    process.execPath,
    [cliPath, 'complete', habitId, '--date=2026-01-01', '--note=a=b=c'],
    {
      cwd: repoRoot,
      env,
      encoding: 'utf8',
    }
  );

  const historyOutput = execFileSync(process.execPath, [cliPath, 'history', habitId], {
    cwd: repoRoot,
    env,
    encoding: 'utf8',
  });

  assert.match(historyOutput, /2026-01-01 \| a=b=c/);
});
