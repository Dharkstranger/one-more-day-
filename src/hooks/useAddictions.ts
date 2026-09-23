import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { AddictionRow } from '../db/types';
import { createAddiction, deleteAddiction, listAddictions, refreshProgress, type NewAddiction } from '../db/repo/addictions';
import type { Progress } from '../services/recovery/progress';

export interface AddictionWithProgress {
  addiction: AddictionRow;
  progress: Progress;
}

export function useAddictions() {
  const db = useSQLiteContext();
  const [items, setItems] = useState<AddictionWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const rows = await listAddictions(db);
    const withProgress = await Promise.all(
      rows.map(async (addiction) => ({ addiction, progress: await refreshProgress(db, addiction) })),
    );
    setItems(withProgress);
    setLoading(false);
  }, [db]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(
    async (input: NewAddiction) => {
      const id = await createAddiction(db, input);
      await reload();
      return id;
    },
    [db, reload],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteAddiction(db, id);
      await reload();
    },
    [db, reload],
  );

  return { items, loading, reload, add, remove };
}
