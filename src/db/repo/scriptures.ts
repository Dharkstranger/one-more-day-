import type { SQLiteDatabase } from 'expo-sqlite';
import type { ScriptureRow } from '../types';

/**
 * Verses whose primary or secondary tags match any of `tags`.
 * Primary-tag matches come first; ties are shuffled so the person
 * doesn't get the same verse every time.
 */
export async function findScripturesByTags(db: SQLiteDatabase, tags: string[], limit = 5): Promise<ScriptureRow[]> {
  if (tags.length === 0) return [];
  const placeholders = tags.map(() => '?').join(',');
  const likeClauses = tags.map(() => `(',' || secondary_tags || ',') LIKE ?`).join(' OR ');
  return db.getAllAsync<ScriptureRow>(
    `SELECT * FROM scriptures
     WHERE primary_emotion_tag IN (${placeholders}) OR ${likeClauses}
     ORDER BY (primary_emotion_tag IN (${placeholders})) DESC, RANDOM()
     LIMIT ?`,
    ...tags, ...tags.map((t) => `%,${t},%`), ...tags, limit,
  );
}

/** Same verse all day, a different one tomorrow. */
export async function verseOfTheDay(db: SQLiteDatabase, dayNumber: number): Promise<ScriptureRow | null> {
  const row = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM scriptures');
  const n = row?.n ?? 0;
  if (!n) return null;
  return db.getFirstAsync<ScriptureRow>('SELECT * FROM scriptures ORDER BY id LIMIT 1 OFFSET ?', dayNumber % n);
}

export function scriptureRef(s: Pick<ScriptureRow, 'book' | 'chapter' | 'verse' | 'translation'>): string {
  return `${s.book} ${s.chapter}:${s.verse} (${s.translation})`;
}
