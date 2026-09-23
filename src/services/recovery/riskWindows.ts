import type { LogRow, TimeOfDay } from '../../db/types';
import { TIME_OF_DAY_RANGES } from './time';

export interface RiskWindow {
  dayOfWeek: number; // 0 = Sunday, matches Date.getDay()
  timeOfDay: TimeOfDay;
  /** How many slips/urges have happened in this window. */
  count: number;
}

/**
 * Finds the day-of-week + time-of-day slots where the person most often slips
 * or has urges, so the app can check in *before* the next one.
 * Needs at least `minCount` events in a slot to count as a pattern.
 */
export function findRiskWindows(
  logs: Pick<LogRow, 'day_of_week' | 'time_of_day'>[],
  { minCount = 2, limit = 3 }: { minCount?: number; limit?: number } = {},
): RiskWindow[] {
  const counts = new Map<string, RiskWindow>();
  for (const log of logs) {
    const key = `${log.day_of_week}|${log.time_of_day}`;
    const existing = counts.get(key);
    if (existing) existing.count += 1;
    else counts.set(key, { dayOfWeek: log.day_of_week, timeOfDay: log.time_of_day, count: 1 });
  }
  return [...counts.values()]
    .filter((w) => w.count >= minCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

/** When to nudge: `leadMinutes` before the risk window starts. */
export function nudgeTimeFor(w: RiskWindow, leadMinutes = 30): { dayOfWeek: number; hour: number; minute: number } {
  const startMinutes = TIME_OF_DAY_RANGES[w.timeOfDay][0] * 60 - leadMinutes;
  const wrapped = (startMinutes + 7 * 24 * 60) % (24 * 60);
  const dayShift = startMinutes < 0 ? -1 : 0;
  return {
    dayOfWeek: (w.dayOfWeek + dayShift + 7) % 7,
    hour: Math.floor(wrapped / 60),
    minute: wrapped % 60,
  };
}
