import type { SQLiteDatabase } from 'expo-sqlite';
import { awardRays } from '../../db/repo/rays';
import { milestonesReached, localDay } from './engine';
import { milestoneRays, RAY_AMOUNTS } from './rules';

export const awardCheckin = (db: SQLiteDatabase, day = localDay()) =>
  awardRays(db, { kind: 'checkin', amount: RAY_AMOUNTS.checkin, ref: `checkin:${day}` });

export const awardUrgeBeaten = (db: SQLiteDatabase, addictionId: string, logId: string) =>
  awardRays(db, { kind: 'urge_beaten', amount: RAY_AMOUNTS.urge_beaten, addictionId, ref: `urge:${logId}` });

export const awardHonestSlip = (db: SQLiteDatabase, addictionId: string, logId: string) =>
  awardRays(db, { kind: 'honest_slip', amount: RAY_AMOUNTS.honest_slip, addictionId, ref: `slip:${logId}` });

export const awardReflection = (db: SQLiteDatabase, ref: string) =>
  awardRays(db, { kind: 'reflection', amount: RAY_AMOUNTS.reflection, ref: `reflection:${ref}` });

export const awardFirstStep = (db: SQLiteDatabase) =>
  awardRays(db, { kind: 'first_step', amount: RAY_AMOUNTS.first_step, ref: 'first_step' });

/**
 * Awards any milestone reached in the current streak that hasn't been awarded yet.
 * The ref includes the streak start, so milestones can be earned again after a restart.
 * Returns the highest newly reached milestone day, or null.
 */
export async function syncMilestones(
  db: SQLiteDatabase,
  addictionId: string,
  streakDays: number,
  streakStartedAt: Date,
): Promise<number | null> {
  let newest: number | null = null;
  for (const day of milestonesReached(streakDays)) {
    const got = await awardRays(db, {
      kind: 'milestone',
      amount: milestoneRays(day),
      addictionId,
      ref: `milestone:${addictionId}:${streakStartedAt.toISOString()}:${day}`,
    });
    if (got > 0) newest = day;
  }
  return newest;
}
