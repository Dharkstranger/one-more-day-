import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { DangerZoneRow } from '../types';

export interface NewDangerZone {
  addictionId: string;
  label?: string;
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}

export async function addDangerZone(db: SQLiteDatabase, input: NewDangerZone): Promise<string> {
  const id = randomUUID();
  await db.runAsync(
    `INSERT INTO danger_zones (id, addiction_id, label, latitude, longitude, radius_meters, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    id, input.addictionId, input.label ?? null, input.latitude, input.longitude, input.radiusMeters ?? 100,
    new Date().toISOString(),
  );
  return id;
}

export function listDangerZones(db: SQLiteDatabase): Promise<DangerZoneRow[]> {
  return db.getAllAsync<DangerZoneRow>('SELECT * FROM danger_zones');
}

export async function deleteDangerZone(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM danger_zones WHERE id = ?', id);
}
