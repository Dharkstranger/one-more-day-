import type { SQLiteDatabase } from 'expo-sqlite';
import { SCRIPTURE_SEED } from './scriptures';

/** Inserts any seed verses that are missing. Existing rows are left alone. */
export async function seedScriptures(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const s of SCRIPTURE_SEED) {
      await db.runAsync(
        `INSERT OR IGNORE INTO scriptures
           (id, book, chapter, verse, text, translation, primary_emotion_tag, secondary_tags)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        s.id, s.book, s.chapter, s.verse, s.text, s.translation, s.primary_emotion_tag, s.secondary_tags,
      );
    }
  });
}
