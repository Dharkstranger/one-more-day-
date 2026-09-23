import type { SQLiteDatabase } from 'expo-sqlite';
import { randomUUID } from 'expo-crypto';
import type { LogRow, LogType } from '../types';
import { timeOfDay } from '../../services/recovery/time';

export interface NewLog {
  addictionId: string;
  logType: LogType;
  /** Defaults to now. Lets people log a slip after the fact. */
  at?: Date;
  triggerEmotion?: string;
  userNote?: string;
}

export async function addLog(db: SQLiteDatabase, input: NewLog): Promise<string> {
  const id = randomUUID();
  const at = input.at ?? new Date();
  await db.runAsync(
    `INSERT INTO logs (id, addiction_id, log_type, timestamp, day_of_week, time_of_day, trigger_emotion, user_note)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    id, input.addictionId, input.logType, at.toISOString(), at.getDay(), timeOfDay(at),
    input.triggerEmotion ?? null, input.userNote ?? null,
  );
  return id;
}

export async function setAiSummary(db: SQLiteDatabase, logId: string, summary: string): Promise<void> {
  await db.runAsync('UPDATE logs SET ai_response_summary = ? WHERE id = ?', summary, logId);
}

export function listLogs(db: SQLiteDatabase, addictionId?: string, limit = 200): Promise<LogRow[]> {
  return addictionId
    ? db.getAllAsync<LogRow>('SELECT * FROM logs WHERE addiction_id = ? ORDER BY timestamp DESC LIMIT ?', addictionId, limit)
    : db.getAllAsync<LogRow>('SELECT * FROM logs ORDER BY timestamp DESC LIMIT ?', limit);
}
