import type { SQLiteDatabase } from 'expo-sqlite';
import type { UserProfileRow } from '../types';

/**
 * Known profile keys. Values are short free text the person chose to share
 * (never names, emails, or phone numbers). Anything here may be sent to the AI.
 */
export const PROFILE_KEYS = ['hobbies', 'work', 'personality', 'faith_background', 'known_triggers', 'support_people'] as const;
export type ProfileKey = (typeof PROFILE_KEYS)[number];

/** App settings live in the same key/value table under a `setting.` prefix and are never sent to the AI. */
export const SETTING_PREFIX = 'setting.';

export async function setProfileValue(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO user_profile (key, value, collected_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, collected_at = excluded.collected_at`,
    key, value, new Date().toISOString(),
  );
}

export async function getProfileValue(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<UserProfileRow>('SELECT * FROM user_profile WHERE key = ?', key);
  return row?.value ?? null;
}

/** Only the known, user-shared keys — this is what the AI sees. */
export async function getSharedProfile(db: SQLiteDatabase): Promise<Partial<Record<ProfileKey, string>>> {
  const rows = await db.getAllAsync<UserProfileRow>(
    `SELECT * FROM user_profile WHERE key IN (${PROFILE_KEYS.map(() => '?').join(',')})`,
    ...PROFILE_KEYS,
  );
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function deleteAllProfile(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM user_profile');
}
