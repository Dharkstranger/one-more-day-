import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeProgress } from '../src/services/recovery/progress';
import { milestoneMessage } from '../src/services/recovery/milestones';

const DAY = 86_400_000;
const start = new Date('2026-01-01T12:00:00Z');
const at = (days: number) => new Date(start.getTime() + days * DAY);
const addiction = { interval_days: 60, allowance_hours: 24, created_at: start.toISOString() };

test('streak counts full days since creation when nothing is logged', () => {
  const p = computeProgress(addiction, [], at(10.5));
  assert.equal(p.streakDays, 10);
  assert.equal(p.stackedHours, 0);
  assert.equal(p.daysUntilNextCycle, 50);
});

test('each completed interval banks allowance_hours', () => {
  const p = computeProgress(addiction, [], at(125));
  assert.equal(p.cyclesCompleted, 2);
  assert.equal(p.stackedHours, 48);
});

test('a slip or failed urge resets streak and banked hours; averted urges do not', () => {
  const logs = [
    { log_type: 'slip' as const, timestamp: at(70).toISOString() },
    { log_type: 'urging_averted' as const, timestamp: at(80).toISOString() },
  ];
  const p = computeProgress(addiction, logs, at(85));
  assert.equal(p.streakDays, 15);
  assert.equal(p.stackedHours, 0);

  const failed = computeProgress(addiction, [{ log_type: 'urging_failed', timestamp: at(84).toISOString() }], at(85));
  assert.equal(failed.streakDays, 1);
});

test('reads SQLite CURRENT_TIMESTAMP format as UTC', () => {
  const p = computeProgress({ ...addiction, created_at: '2026-01-01 12:00:00' }, [], at(3));
  assert.equal(p.streakDays, 3);
});

test('banked hours are never framed as permission, and substances get the tolerance warning', () => {
  const p = computeProgress(addiction, [], at(61));
  const m = milestoneMessage('alcohol', 'substance', p);
  assert.match(m.body, /keep it banked/);
  assert.ok(m.safetyNote?.includes('overdose'));
  assert.equal(milestoneMessage('social media', 'digital', p).safetyNote, undefined);
});
