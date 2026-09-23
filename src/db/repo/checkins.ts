import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { CheckinRow } from '../types';

export async function saveCheckin(
  db: SQLiteDatabase,
  c: { day: string; mood: CheckinRow['mood']; gratitude?: string; note?: string },
): Promise<void> {
  await db.runAsync(
    `INSERT INTO checkins (id, day, mood, gratitude, note, created_at) VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(day) DO UPDATE SET mood = excluded.mood, gratitude = excluded.gratitude, note = excluded.note`,
    randomUUID(), c.day, c.mood, c.gratitude ?? null, c.note ?? null, new Date().toISOString(),
  );
}

export function getCheckin(db: SQLiteDatabase, day: string): Promise<CheckinRow | null> {
  return db.getFirstAsync<CheckinRow>('SELECT * FROM checkins WHERE day = ?', day);
}

export function listCheckins(db: SQLiteDatabase, limit = 60): Promise<CheckinRow[]> {
  return db.getAllAsync<CheckinRow>('SELECT * FROM checkins ORDER BY day DESC LIMIT ?', limit);
}
