import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { RayKind, RayRow } from '../types';

/**
 * Adds rays. With a `ref`, the award happens at most once (e.g. one check-in per day).
 * Returns the amount actually awarded (0 if it was already given).
 */
export async function awardRays(
  db: SQLiteDatabase,
  a: { kind: RayKind; amount: number; addictionId?: string | null; ref?: string },
): Promise<number> {
  const res = await db.runAsync(
    `INSERT OR IGNORE INTO rays (id, kind, amount, addiction_id, ref, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    randomUUID(), a.kind, a.amount, a.addictionId ?? null, a.ref ?? null, new Date().toISOString(),
  );
  return res.changes > 0 ? a.amount : 0;
}

export async function totalRays(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ total: number | null }>('SELECT SUM(amount) AS total FROM rays');
  return row?.total ?? 0;
}

export function recentRays(db: SQLiteDatabase, limit = 30): Promise<RayRow[]> {
  return db.getAllAsync<RayRow>('SELECT * FROM rays ORDER BY created_at DESC LIMIT ?', limit);
}
