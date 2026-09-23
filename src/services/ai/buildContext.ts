import type { SQLiteDatabase } from 'expo-sqlite';
import type { AddictionRow } from '../../db/types';
import { findScripturesByTags } from '../../db/repo/scriptures';
import { getSharedProfile } from '../../db/repo/profile';
import { listLogs } from '../../db/repo/logs';
import { computeProgress } from '../recovery/progress';
import { findRiskWindows } from '../recovery/riskWindows';
import { prayerChaptersFor, tagsFor } from './scriptureTags';
import type { SponsorContext, SponsorMode } from './contract';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Collects only what the sponsor needs for this one reply. This is everything
 * that leaves the phone: no ids, no timestamps, no location, no free-text notes
 * from older logs.
 */
export async function buildSponsorContext(
  db: SQLiteDatabase,
  opts: { mode: SponsorMode; addiction: AddictionRow | null; text: string; emotion?: string | null },
): Promise<SponsorContext> {
  const tags = tagsFor({ text: opts.text, emotion: opts.emotion, slipped: opts.mode === 'slip' });
  const verses = await findScripturesByTags(db, tags, 5);

  let progress: SponsorContext['progress'] = null;
  let recentPattern: string[] = [];
  if (opts.addiction) {
    const logs = await listLogs(db, opts.addiction.id, 500);
    const p = computeProgress(opts.addiction, logs);
    progress = { streakDays: p.streakDays, stackedHours: p.stackedHours, intervalDays: opts.addiction.interval_days };
    recentPattern = findRiskWindows(logs).map(
      (w) => `${DAY_NAMES[w.dayOfWeek]} ${w.timeOfDay.replace('_', ' ')}: ${w.count} slips or urges`,
    );
  }

  return {
    addiction: opts.addiction ? { name: opts.addiction.name, category: opts.addiction.category } : null,
    progress,
    recentPattern,
    profile: await getSharedProfile(db),
    candidateVerses: verses.map((v) => ({
      id: v.id,
      reference: `${v.book} ${v.chapter}:${v.verse} (${v.translation})`,
      text: v.text,
    })),
    prayerChapters: prayerChaptersFor(tags),
  };
}
