import type { AddictionRow, LogRow, LogType } from '../../db/types';
import { DAY_MS, parseDbTimestamp } from './time';

/** Log types that mean the person used. Both reset the streak to zero. */
export const RESET_LOG_TYPES: readonly LogType[] = ['slip', 'urging_failed'];

export interface Progress {
  streakDays: number;
  /** Full clean intervals completed since the last reset. */
  cyclesCompleted: number;
  /** allowance_hours earned per completed cycle. Resets with the streak. */
  stackedHours: number;
  daysUntilNextCycle: number;
  lastResetAt: Date;
}

/**
 * Streak and earned hours are derived from the log history, never incremented
 * in place, so they cannot drift. The columns on `addictions` are a cache of this.
 */
export function computeProgress(
  addiction: Pick<AddictionRow, 'interval_days' | 'allowance_hours' | 'created_at'>,
  logs: Pick<LogRow, 'log_type' | 'timestamp'>[],
  now: Date = new Date(),
): Progress {
  let lastResetAt = parseDbTimestamp(addiction.created_at);
  for (const log of logs) {
    if (!RESET_LOG_TYPES.includes(log.log_type)) continue;
    const t = parseDbTimestamp(log.timestamp);
    if (t > lastResetAt) lastResetAt = t;
  }

  const interval = Math.max(1, addiction.interval_days);
  const streakDays = Math.max(0, Math.floor((now.getTime() - lastResetAt.getTime()) / DAY_MS));
  const cyclesCompleted = Math.floor(streakDays / interval);

  return {
    streakDays,
    cyclesCompleted,
    stackedHours: cyclesCompleted * (addiction.allowance_hours ?? 24),
    daysUntilNextCycle: interval - (streakDays % interval),
    lastResetAt,
  };
}
