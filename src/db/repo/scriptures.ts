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
