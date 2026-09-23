import type { LogRow } from '../../db/types';
import { RESET_LOG_TYPES } from '../recovery/progress';
import { DAY_MS, parseDbTimestamp } from '../recovery/time';
import { GENTLE_MODE_SLIPS, GENTLE_MODE_WINDOW_DAYS, LEVELS, MILESTONE_LADDER, type Level } from './rules';

export interface LevelProgress {
  level: Level;
  next: Level | null;
  /** 0..1 progress from this level to the next. 1 at the top level. */
  fraction: number;
  raysToNext: number;
}

export function levelFor(totalRays: number): LevelProgress {
  let level = LEVELS[0];
  for (const l of LEVELS) if (totalRays >= l.minRays) level = l;
  const next = LEVELS[level.index + 1] ?? null;
  if (!next) return { level, next, fraction: 1, raysToNext: 0 };
  const span = next.minRays - level.minRays;
  return { level, next, fraction: (totalRays - level.minRays) / span, raysToNext: next.minRays - totalRays };
}

/** The next milestone day above the current streak. */
export function nextMilestone(streakDays: number): number {
  return MILESTONE_LADDER.find((d) => d > streakDays) ?? Math.ceil((streakDays + 1) / 365) * 365;
}

/** Milestones reached in the current streak, for awarding rays once each. */
export function milestonesReached(streakDays: number): number[] {
  return MILESTONE_LADDER.filter((d) => d <= streakDays);
}

export type Weather = 'storm' | 'rain' | 'cloudy' | 'clearing' | 'clear';

/**
 * Today's weather sits on top of the sky. The sky itself follows your level,
 * which never goes down. So a slip brings clouds, not darkness.
 */
export function weatherFor(opts: { slippedToday: boolean; shortestStreak: number; moodToday: number | null }): Weather {
  if (opts.slippedToday) return opts.moodToday !== null && opts.moodToday <= 2 ? 'storm' : 'rain';
  if (opts.moodToday !== null && opts.moodToday <= 2) return 'cloudy';
  if (opts.shortestStreak < 3) return 'clearing';
  return 'clear';
}

export interface TrackerStats {
  streakDays: number;
  longestStreakDays: number;
  /** Days since starting, minus days with a slip. Never resets. */
  cleanDaysTotal: number;
  slipsLast14Days: number;
  gentleMode: boolean;
  moneySaved: number;
  hoursReclaimed: number;
  /** For observe mode: how many times per week in the last 4 weeks, oldest first. */
  weeklyCounts: number[];
}

export function trackerStats(
  opts: { createdAt: string; weeklyCost: number; weeklyHours: number },
  logs: Pick<LogRow, 'log_type' | 'timestamp'>[],
  now: Date = new Date(),
): TrackerStats {
  const start = parseDbTimestamp(opts.createdAt);
  const slipTimes = logs
    .filter((l) => RESET_LOG_TYPES.includes(l.log_type))
    .map((l) => parseDbTimestamp(l.timestamp))
    .filter((t) => t >= start && t <= now)
    .sort((a, b) => a.getTime() - b.getTime());

  // Longest gap between resets, including the current run.
  let longest = 0;
  let prev = start;
  for (const t of [...slipTimes, now]) {
    longest = Math.max(longest, Math.floor((t.getTime() - prev.getTime()) / DAY_MS));
    prev = t;
  }
  const last = slipTimes.length ? slipTimes[slipTimes.length - 1] : start;
  const streakDays = Math.floor((now.getTime() - last.getTime()) / DAY_MS);

  const totalDays = Math.floor((now.getTime() - start.getTime()) / DAY_MS);
  const slipDays = new Set(slipTimes.map((t) => t.toDateString())).size;
  const cleanDaysTotal = Math.max(0, totalDays - slipDays);

  const windowStart = now.getTime() - GENTLE_MODE_WINDOW_DAYS * DAY_MS;
  const slipsLast14Days = slipTimes.filter((t) => t.getTime() >= windowStart).length;

  const weeklyCounts = [3, 2, 1, 0].map((weeksAgo) => {
    const hi = now.getTime() - weeksAgo * 7 * DAY_MS;
    const lo = hi - 7 * DAY_MS;
    return slipTimes.filter((t) => t.getTime() > lo && t.getTime() <= hi).length;
  });

  return {
    streakDays,
    longestStreakDays: longest,
    cleanDaysTotal,
    slipsLast14Days,
    gentleMode: slipsLast14Days >= GENTLE_MODE_SLIPS,
    moneySaved: Math.round((opts.weeklyCost / 7) * cleanDaysTotal * 100) / 100,
    hoursReclaimed: Math.round((opts.weeklyHours / 7) * cleanDaysTotal),
    weeklyCounts,
  };
}

/** Local calendar day, YYYY-MM-DD. */
export function localDay(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
