// The rules of Sunshine, in one place so contributors can tune them.
// Rays are lifetime points: earned, never taken away. A slip resets a streak,
// never your light.
import type { RayKind } from '../../db/types';

export const RAY_AMOUNTS: Record<RayKind, number> = {
  first_step: 20, // created your first tracker
  checkin: 10, // once per day
  urge_beaten: 15, // logged an urge you rode out
  honest_slip: 5, // told the truth about a slip. Honesty is progress.
  reflection: 5, // talked it through with the sponsor or wrote what happened
  milestone: 25, // reached a day on the milestone ladder (bonus scales, see milestoneRays)
};

/** Day counts that earn a milestone. Small steps first, for people who keep slipping. */
export const MILESTONE_LADDER = [1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365, 500, 730, 1000];

export function milestoneRays(day: number): number {
  return RAY_AMOUNTS.milestone + Math.floor(day / 10) * 5;
}

export interface Level {
  index: number;
  name: string;
  /** Lifetime rays needed to reach this level. */
  minRays: number;
  line: string;
}

export const LEVELS: Level[] = [
  { index: 0, name: 'Night', minRays: 0, line: 'Every sunrise starts in the dark. You showed up.' },
  { index: 1, name: 'First Light', minRays: 40, line: 'A thin line on the horizon. Something is changing.' },
  { index: 2, name: 'Dawn', minRays: 150, line: 'The sky is turning. Keep facing east.' },
  { index: 3, name: 'Sunrise', minRays: 400, line: 'The sun is up. People around you can see it too.' },
  { index: 4, name: 'Morning', minRays: 900, line: 'Warm, steady light. This is becoming who you are.' },
  { index: 5, name: 'Midday', minRays: 1800, line: 'Bright and strong. Your light reaches others now.' },
  { index: 6, name: 'Sunshine', minRays: 3500, line: 'You are sunshine. Keep shining, one more day.' },
];

/** Slips in the last 14 days that switch on gentle mode (smaller goals, more support). */
export const GENTLE_MODE_SLIPS = 3;
export const GENTLE_MODE_WINDOW_DAYS = 14;
