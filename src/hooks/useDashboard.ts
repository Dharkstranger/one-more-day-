import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import type { AddictionDetailsRow, AddictionRow, CheckinRow, ScriptureRow } from '../db/types';
import { listAddictions, refreshProgress } from '../db/repo/addictions';
import { getDetails, parseReasons } from '../db/repo/details';
import { listLogs } from '../db/repo/logs';
import { getCheckin } from '../db/repo/checkins';
import { totalRays } from '../db/repo/rays';
import { verseOfTheDay } from '../db/repo/scriptures';
import type { Progress } from '../services/recovery/progress';
import { levelFor, localDay, trackerStats, weatherFor, type LevelProgress, type TrackerStats, type Weather } from '../services/sunshine/engine';
import { syncMilestones } from '../services/sunshine/award';
import { DAY_MS } from '../services/recovery/time';

export interface Tracker {
  addiction: AddictionRow;
  details: AddictionDetailsRow | null;
  reasons: string[];
  progress: Progress;
  stats: TrackerStats;
}

export interface Dashboard {
  trackers: Tracker[];
  rays: number;
  level: LevelProgress;
  today: CheckinRow | null;
  weather: Weather;
  verse: ScriptureRow | null;
  /** Set when a milestone was just reached, for a celebration. */
  celebrate: { name: string; day: number } | null;
}

/** Everything the home screen needs, recomputed each time the screen comes into focus. */
export function useDashboard() {
  const db = useSQLiteContext();
  const [data, setData] = useState<Dashboard | null>(null);

  const load = useCallback(async () => {
    const now = new Date();
    const rows = await listAddictions(db);
    let celebrate: Dashboard['celebrate'] = null;
    let slippedToday = false;

    const trackers: Tracker[] = [];
    for (const addiction of rows) {
      const [details, logs, progress] = await Promise.all([
        getDetails(db, addiction.id),
        listLogs(db, addiction.id, 2000),
        refreshProgress(db, addiction),
      ]);
      const stats = trackerStats(
        { createdAt: addiction.created_at, weeklyCost: details?.weekly_cost ?? 0, weeklyHours: details?.weekly_hours ?? 0 },
        logs,
        now,
      );
      if (logs.some((l) => l.log_type !== 'urging_averted' && localDay(new Date(l.timestamp)) === localDay(now))) {
        slippedToday = true;
      }
      if (details?.mode !== 'observe') {
        const reached = await syncMilestones(db, addiction.id, progress.streakDays, progress.lastResetAt);
        if (reached) celebrate = { name: addiction.name, day: reached };
      }
      trackers.push({ addiction, details, reasons: parseReasons(details), progress, stats });
    }

    const [rays, today] = await Promise.all([totalRays(db), getCheckin(db, localDay(now))]);
    const verse = await verseOfTheDay(db, Math.floor(now.getTime() / DAY_MS));
    const shortest = trackers.length ? Math.min(...trackers.map((t) => t.progress.streakDays)) : 0;

    setData({
      trackers,
      rays,
      level: levelFor(rays),
      today,
      weather: weatherFor({ slippedToday, shortestStreak: shortest, moodToday: today?.mood ?? null }),
      verse,
      celebrate,
    });
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return { data, reload: load };
}
