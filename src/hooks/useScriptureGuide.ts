import { useCallback, useEffect, useRef, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getAddiction } from '../db/repo/addictions';
import { listLogs } from '../db/repo/logs';
import { getProfileValue } from '../db/repo/profile';
import { findScripturesByTags } from '../db/repo/scriptures';
import { tagsFor, prayerChaptersFor } from '../services/ai/scriptureTags';
import { askScriptureGuide } from '../services/scripture/client';
import type { ScriptureGuidance, ScriptureMoment } from '../services/scripture/contract';
import { getBibleLanguage, getRecentPassages, rememberPassage, TRANSLATION_FOR } from '../services/scripture/prefs';
import { trackerStats } from '../services/sunshine/engine';
import { RESET_LOG_TYPES } from '../services/recovery/progress';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const partOfDay = (h: number) => (h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 21 ? 'evening' : 'late evening');

export interface GuideInput {
  moment: ScriptureMoment;
  addictionId?: string | null;
  emotion?: string | null;
  note?: string;
  mood?: number;
  milestoneDay?: number;
}

export type GuideState =
  | { status: 'loading' }
  | { status: 'ready'; guidance: ScriptureGuidance }
  | { status: 'offline'; guidance: ScriptureGuidance };

/**
 * Gathers the person's situation from the device and asks the Scripture Guide.
 * If it can't be reached, builds the same card from verses stored on the device.
 * Only this request leaves the phone; see docs/privacy.md.
 */
export function useScriptureGuide(input: GuideInput | null) {
  const db = useSQLiteContext();
  const [state, setState] = useState<GuideState>({ status: 'loading' });
  const abort = useRef<AbortController | null>(null);
  const key = input ? JSON.stringify(input) : null;

  const run = useCallback(async () => {
    if (!input) return;
    setState({ status: 'loading' });
    const language = await getBibleLanguage(db);
    const recent = await getRecentPassages(db);
    const addiction = input.addictionId ? await getAddiction(db, input.addictionId) : null;
    const now = new Date();

    const situation: Parameters<typeof askScriptureGuide>[0]['situation'] = {
      emotion: input.emotion ?? undefined,
      note: input.note?.slice(0, 600) || undefined,
      timeOfDay: partOfDay(now.getHours()),
      dayOfWeek: DAYS[now.getDay()],
      mood: input.mood,
      milestoneDay: input.milestoneDay,
    };
    if (addiction) {
      const logs = await listLogs(db, addiction.id, 2000);
      const stats = trackerStats({ createdAt: addiction.created_at, weeklyCost: 0, weeklyHours: 0 }, logs, now);
      situation.streakDays = stats.streakDays;
      situation.bestRunDays = stats.longestStreakDays;
      situation.slipsLast14Days = stats.slipsLast14Days;
      situation.gentleMode = stats.gentleMode;
      if (input.moment === 'slip') {
        const resets = logs.filter((l) => RESET_LOG_TYPES.includes(l.log_type)).map((l) => new Date(l.timestamp).getTime());
        resets.sort((a, b) => b - a);
        const before = resets[1] ?? new Date(addiction.created_at).getTime();
        situation.streakBeforeSlip = Math.max(0, Math.floor(((resets[0] ?? now.getTime()) - before) / 86_400_000));
      }
    }

    abort.current?.abort();
    abort.current = new AbortController();
    try {
      const guidance = await askScriptureGuide(
        {
          moment: input.moment,
          language,
          addiction: addiction ? { name: addiction.name, category: addiction.category ?? 'behavioral' } : null,
          situation,
          faithBackground: (await getProfileValue(db, 'faith_background')) ?? undefined,
          recentReferences: recent,
        },
        abort.current.signal,
      );
      await rememberPassage(db, `${guidance.reference.book} ${guidance.reference.chapter}:${guidance.reference.start}`);
      setState({ status: 'ready', guidance });
    } catch {
      // Offline or not configured: use the verses stored on the device.
      const tags = tagsFor({ text: input.note, emotion: input.emotion, slipped: input.moment === 'slip' });
      const [v] = await findScripturesByTags(db, tags, 1, TRANSLATION_FOR[language]);
      const chapter = prayerChaptersFor(tags)[0] ?? 'Psalm 23';
      if (!v) return;
      setState({
        status: 'offline',
        guidance: {
          reference: { book: v.book, chapter: v.chapter, start: v.verse, end: v.verse, display: `${v.book} ${v.chapter}:${v.verse}` },
          text: v.text,
          textLanguage: v.translation === 'WEB' ? 'en' : language,
          why: '',
          question: '',
          prayer: '',
          readToday: { book: '', chapter: 0, display: chapter },
          nextStep: '',
        },
      });
    }
  }, [db, key]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void run();
    return () => abort.current?.abort();
  }, [run]);

  return { state, another: run };
}
