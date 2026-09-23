// App actions that touch several tables at once. Screens call these,
// so the rules (rays, nudges, progress cache) live in one place.
import type { SQLiteDatabase } from 'expo-sqlite';
import { createAddiction, getAddiction, refreshProgress } from '../db/repo/addictions';
import { upsertDetails, type DetailsInput } from '../db/repo/details';
import { addLog, listLogs } from '../db/repo/logs';
import { saveCheckin } from '../db/repo/checkins';
import type { AddictionCategory, CheckinRow, LogType } from '../db/types';
import { findRiskWindows } from './recovery/riskWindows';
import { scheduleRiskNudges } from './notifications/local';
import { awardCheckin, awardFirstStep, awardHonestSlip, awardUrgeBeaten } from './sunshine/award';
import { localDay } from './sunshine/engine';

export async function startTracking(
  db: SQLiteDatabase,
  input: { name: string; category: AddictionCategory; intervalDays: number; allowanceHours?: number } & DetailsInput,
): Promise<string> {
  const id = await createAddiction(db, input);
  await upsertDetails(db, id, input);
  await awardFirstStep(db);
  return id;
}

export interface LogResult {
  logId: string;
  raysEarned: number;
}

export async function recordLog(
  db: SQLiteDatabase,
  input: { addictionId: string; logType: LogType; at?: Date; triggerEmotion?: string; userNote?: string },
): Promise<LogResult> {
  const logId = await addLog(db, input);
  const raysEarned =
    input.logType === 'urging_averted'
      ? await awardUrgeBeaten(db, input.addictionId, logId)
      : await awardHonestSlip(db, input.addictionId, logId);

  const addiction = await getAddiction(db, input.addictionId);
  if (addiction) await refreshProgress(db, addiction);

  const all = await listLogs(db, undefined, 1000);
  await scheduleRiskNudges(db, findRiskWindows(all)).catch(() => {
    // Notifications may be off; the log itself must still succeed.
  });
  return { logId, raysEarned };
}

export async function recordCheckin(
  db: SQLiteDatabase,
  c: { mood: CheckinRow['mood']; gratitude?: string; note?: string },
): Promise<number> {
  const day = localDay();
  await saveCheckin(db, { day, ...c });
  return awardCheckin(db, day);
}
