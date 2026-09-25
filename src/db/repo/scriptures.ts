import type { SQLiteDatabase } from 'expo-sqlite';
import type { ScriptureRow } from '../types';

/**
 * Verses whose primary or secondary tags match any of `tags`.
 * Primary-tag matches come first; ties are shuffled so the person
 * doesn't get the same verse every time.
 */
/** Same verse in another translation: ids are "web-psalms-51-10" → "lsg-psalms-51-10". */
async function localize(db: SQLiteDatabase, row: ScriptureRow, translation: string): Promise<ScriptureRow> {
  if (translation === 'WEB') return row;
  const local = await db.getFirstAsync<ScriptureRow>('SELECT * FROM scriptures WHERE id = ?', `${translation.toLowerCase()}-${row.id.slice(4)}`);
  return local ?? row; // not available in that language: English
}

/**
 * Verses whose primary or secondary tags match any of `tags`, in `translation`
 * (falling back to English per verse). Primary-tag matches come first; ties are
 * shuffled so the person doesn't get the same verse every time.
 */
export async function findScripturesByTags(db: SQLiteDatabase, tags: string[], limit = 5, translation = 'WEB'): Promise<ScriptureRow[]> {
  if (tags.length === 0) return [];
  const placeholders = tags.map(() => '?').join(',');
  const likeClauses = tags.map(() => `(',' || secondary_tags || ',') LIKE ?`).join(' OR ');
  const rows = await db.getAllAsync<ScriptureRow>(
    `SELECT * FROM scriptures
     WHERE translation = 'WEB' AND (primary_emotion_tag IN (${placeholders}) OR ${likeClauses})
     ORDER BY (primary_emotion_tag IN (${placeholders})) DESC, RANDOM()
     LIMIT ?`,
    ...tags, ...tags.map((t) => `%,${t},%`), ...tags, limit,
  );
  return Promise.all(rows.map((r) => localize(db, r, translation)));
}

/** Same verse all day, a different one tomorrow. */
export async function verseOfTheDay(db: SQLiteDatabase, dayNumber: number, translation = 'WEB'): Promise<ScriptureRow | null> {
  const row = await db.getFirstAsync<{ n: number }>("SELECT COUNT(*) AS n FROM scriptures WHERE translation = 'WEB'");
  const n = row?.n ?? 0;
  if (!n) return null;
  const en = await db.getFirstAsync<ScriptureRow>("SELECT * FROM scriptures WHERE translation = 'WEB' ORDER BY id LIMIT 1 OFFSET ?", dayNumber % n);
  return en ? localize(db, en, translation) : null;
}

export function scriptureRef(s: Pick<ScriptureRow, 'book' | 'chapter' | 'verse' | 'translation'>): string {
  return `${s.book} ${s.chapter}:${s.verse} (${s.translation})`;
}
