import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from './schema';
import { seedScriptures } from './seed/seedScriptures';

export const DATABASE_NAME = 'one-more-day.db';

/** Passed to <SQLiteProvider onInit>. Safe to run on every app start. */
export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;

  while (version < MIGRATIONS.length) {
    const sql = MIGRATIONS[version];
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
    });
    version += 1;
    // PRAGMA does not accept bound parameters; version is an integer we control.
    await db.execAsync(`PRAGMA user_version = ${version}`);
  }

  await seedScriptures(db);
}
