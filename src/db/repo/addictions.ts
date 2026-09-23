import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { AddictionCategory, AddictionRow, LogRow } from '../types';
import { computeProgress, type Progress } from '../../services/recovery/progress';

export interface NewAddiction {
  name: string;
  category: AddictionCategory;
  intervalDays: number;
  allowanceHours?: number;
}

export async function createAddiction(db: SQLiteDatabase, input: NewAddiction): Promise<string> {
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO addictions (id, name, category, interval_days, allowance_hours, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id, input.name.trim(), input.category, input.intervalDays, input.allowanceHours ?? 24, new Date().toISOString(),
  );
  return id;
}

export function listAddictions(db: SQLiteDatabase): Promise<AddictionRow[]> {
  return db.getAllAsync<AddictionRow>('SELECT * FROM addictions ORDER BY created_at ASC');
}

export function getAddiction(db: SQLiteDatabase, id: string): Promise<AddictionRow | null> {
  return db.getFirstAsync<AddictionRow>('SELECT * FROM addictions WHERE id = ?', id);
}

/** Deletes the addiction and everything tied to it. Local data only. */
export async function deleteAddiction(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM logs WHERE addiction_id = ?', id);
    await db.runAsync('DELETE FROM danger_zones WHERE addiction_id = ?', id);
    await db.runAsync('DELETE FROM addictions WHERE id = ?', id);
  });
}

/** Recomputes streak + stacked hours from logs and caches them on the row. */
export async function refreshProgress(db: SQLiteDatabase, addiction: AddictionRow): Promise<Progress> {
  const logs = await db.getAllAsync<Pick<LogRow, 'log_type' | 'timestamp'>>(
    'SELECT log_type, timestamp FROM logs WHERE addiction_id = ?',
    addiction.id,
  );
  const progress = computeProgress(addiction, logs);
  if (progress.streakDays !== addiction.current_streak_days || progress.stackedHours !== addiction.stacked_hours) {
    await db.runAsync(
      'UPDATE addictions SET current_streak_days = ?, stacked_hours = ? WHERE id = ?',
      progress.streakDays, progress.stackedHours, addiction.id,
    );
  }
  return progress;
}
