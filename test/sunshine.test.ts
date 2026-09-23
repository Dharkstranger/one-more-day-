import { test } from 'node:test';
import assert from 'node:assert/strict';
import { levelFor, milestonesReached, nextMilestone, trackerStats, weatherFor } from '../src/services/sunshine/engine';
import { LEVELS } from '../src/services/sunshine/rules';

const DAY = 86_400_000;
const start = new Date('2026-01-01T12:00:00Z');
const at = (d: number) => new Date(start.getTime() + d * DAY).toISOString();

test('levels climb with lifetime rays and top out at Sunshine', () => {
  assert.equal(levelFor(0).level.name, 'Night');
  assert.equal(levelFor(160).level.name, 'Dawn');
  const top = levelFor(99_999);
  assert.equal(top.level.name, 'Sunshine');
  assert.equal(top.fraction, 1);
  assert.equal(top.next, null);
  assert.equal(LEVELS.at(-1)?.name, 'Sunshine');
});

test('milestone ladder starts small', () => {
  assert.equal(nextMilestone(0), 1);
  assert.equal(nextMilestone(1), 3);
  assert.equal(nextMilestone(8), 14);
  assert.deepEqual(milestonesReached(7), [1, 3, 7]);
});

test('a slip brings rain, never darkness', () => {
  assert.equal(weatherFor({ slippedToday: true, shortestStreak: 0, moodToday: 4 }), 'rain');
  assert.equal(weatherFor({ slippedToday: true, shortestStreak: 0, moodToday: 1 }), 'storm');
  assert.equal(weatherFor({ slippedToday: false, shortestStreak: 10, moodToday: null }), 'clear');
});

test('stats: longest streak, forgiving clean-day total, money saved, gentle mode', () => {
  const logs = [
    { log_type: 'slip' as const, timestamp: at(20) },
    { log_type: 'slip' as const, timestamp: at(25) },
    { log_type: 'urging_averted' as const, timestamp: at(26) },
  ];
  const s = trackerStats({ createdAt: at(0), weeklyCost: 70, weeklyHours: 7 }, logs, new Date(at(30)));
  assert.equal(s.streakDays, 5);
  assert.equal(s.longestStreakDays, 20);
  assert.equal(s.cleanDaysTotal, 28);
  assert.equal(s.moneySaved, 280);
  assert.equal(s.hoursReclaimed, 28);
  assert.equal(s.gentleMode, false);

  const many = [21, 23, 26].map((d) => ({ log_type: 'slip' as const, timestamp: at(d) }));
  assert.equal(trackerStats({ createdAt: at(0), weeklyCost: 0, weeklyHours: 0 }, many, new Date(at(30))).gentleMode, true);
});
