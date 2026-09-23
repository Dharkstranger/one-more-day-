import { useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { AddictionDetailsRow, AddictionRow } from '../db/types';
import { listAddictions } from '../db/repo/addictions';
import { getDetails } from '../db/repo/details';

/** Lightweight list for pickers. */
export function useTrackers() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<{ addiction: AddictionRow; details: AddictionDetailsRow | null }[]>([]);
  useEffect(() => {
    void (async () => {
      const rows = await listAddictions(db);
      setItems(await Promise.all(rows.map(async (addiction) => ({ addiction, details: await getDetails(db, addiction.id) }))));
    })();
  }, [db]);
  return items;
}
