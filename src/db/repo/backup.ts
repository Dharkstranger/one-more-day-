import type { SQLiteDatabase } from 'expo-sqlite';
import { MIGRATIONS } from '../schema';

// The backup file format is documented in docs/data-format.md. Keep them in sync.
export const BACKUP_FORMAT = 'one-more-day-backup';
export const BACKUP_TABLES = ['addictions', 'addiction_details', 'logs', 'checkins', 'rays', 'user_profile', 'danger_zones'] as const;

export interface BackupFile {
  format: typeof BACKUP_FORMAT;
  schemaVersion: number;
  exportedAt: string;
  tables: Record<(typeof BACKUP_TABLES)[number], Record<string, unknown>[]>;
}

export async function exportBackup(db: SQLiteDatabase): Promise<BackupFile> {
  const tables = {} as BackupFile['tables'];
  for (const t of BACKUP_TABLES) tables[t] = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${t}`);
  return { format: BACKUP_FORMAT, schemaVersion: MIGRATIONS.length, exportedAt: new Date().toISOString(), tables };
}

export function validateBackup(data: unknown): string | null {
  const b = data as Partial<BackupFile>;
  if (!b || b.format !== BACKUP_FORMAT) return 'This is not a One More Day backup file.';
  if (typeof b.schemaVersion !== 'number' || b.schemaVersion > MIGRATIONS.length) {
    return 'This backup comes from a newer version of the app. Update the app first.';
  }
  if (!b.tables || typeof b.tables !== 'object') return 'The backup file is damaged.';
  return null;
}

/** Replaces everything on this device with the backup. Scriptures are left alone. */
export async function restoreBackup(db: SQLiteDatabase, b: BackupFile): Promise<void> {
  await db.withTransactionAsync(async () => {
    await wipeUserData(db, false);
    // Parents before children, so foreign keys hold.
    for (const t of BACKUP_TABLES) {
      for (const row of b.tables[t] ?? []) {
        const cols = Object.keys(row).filter((c) => /^[a-z_]+$/.test(c));
        if (!cols.length) continue;
        await db.runAsync(
          `INSERT OR REPLACE INTO ${t} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
          ...cols.map((c) => row[c] as string | number | null),
        );
      }
    }
  });
}

/** Deletes every piece of personal data on this device. */
export async function wipeUserData(db: SQLiteDatabase, inTransaction = true): Promise<void> {
  const run = async () => {
    for (const t of [...BACKUP_TABLES].reverse()) await db.runAsync(`DELETE FROM ${t}`);
  };
  if (inTransaction) await db.withTransactionAsync(run);
  else await run();
}
