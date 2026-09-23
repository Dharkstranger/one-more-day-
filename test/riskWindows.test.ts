import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findRiskWindows, nudgeTimeFor } from '../src/services/recovery/riskWindows';

test('finds repeated day/time slots and ignores one-offs', () => {
  const logs = [
    { day_of_week: 5, time_of_day: 'late_evening' as const },
    { day_of_week: 5, time_of_day: 'late_evening' as const },
    { day_of_week: 5, time_of_day: 'late_evening' as const },
    { day_of_week: 1, time_of_day: 'morning' as const },
  ];
  assert.deepEqual(findRiskWindows(logs), [{ dayOfWeek: 5, timeOfDay: 'late_evening', count: 3 }]);
});

test('nudges 30 minutes before the window starts', () => {
  assert.deepEqual(nudgeTimeFor({ dayOfWeek: 5, timeOfDay: 'late_evening', count: 3 }), { dayOfWeek: 5, hour: 20, minute: 30 });
});

test('a night window nudges the evening before, wrapping Sunday to Saturday', () => {
  assert.deepEqual(nudgeTimeFor({ dayOfWeek: 0, timeOfDay: 'night', count: 2 }), { dayOfWeek: 6, hour: 23, minute: 30 });
});
