import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { LogRow } from '../db/types';
import { addLog, listLogs, type NewLog } from '../db/repo/logs';
import { findRiskWindows } from '../services/recovery/riskWindows';
import { scheduleRiskNudges } from '../services/notifications/local';

export function useLogs(addictionId?: string) {
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<LogRow[]>([]);

  const reload = useCallback(async () => {
    setLogs(await listLogs(db, addictionId));
  }, [db, addictionId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** Saves the log, then re-plans the "hard time coming up" nudges from all history. */
  const log = useCallback(
    async (input: NewLog) => {
      const id = await addLog(db, input);
      const all = await listLogs(db, undefined, 1000);
      await scheduleRiskNudges(db, findRiskWindows(all)).catch(() => {
        // Notifications permission may be off; logging must still succeed.
      });
      await reload();
      return id;
    },
    [db, reload],
  );

  return { logs, reload, log };
}
