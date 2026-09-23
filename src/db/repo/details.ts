import type { SQLiteDatabase } from 'expo-sqlite';
import type { AddictionDetailsRow, TrackingMode } from '../types';

export interface DetailsInput {
  emoji?: string;
  mode?: TrackingMode;
  weeklyCost?: number;
  weeklyHours?: number;
  reasons?: string[];
}

export async function upsertDetails(db: SQLiteDatabase, addictionId: string, d: DetailsInput): Promise<void> {
  await db.runAsync(
    `INSERT INTO addiction_details (addiction_id, emoji, mode, weekly_cost, weekly_hours, reasons)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(addiction_id) DO UPDATE SET
       emoji = excluded.emoji, mode = excluded.mode, weekly_cost = excluded.weekly_cost,
       weekly_hours = excluded.weekly_hours, reasons = excluded.reasons`,
    addictionId, d.emoji ?? null, d.mode ?? 'quit', d.weeklyCost ?? 0, d.weeklyHours ?? 0, JSON.stringify(d.reasons ?? []),
  );
}

export function getDetails(db: SQLiteDatabase, addictionId: string): Promise<AddictionDetailsRow | null> {
  return db.getFirstAsync<AddictionDetailsRow>('SELECT * FROM addiction_details WHERE addiction_id = ?', addictionId);
}

export function parseReasons(row: AddictionDetailsRow | null): string[] {
  try {
    const v = JSON.parse(row?.reasons ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}
