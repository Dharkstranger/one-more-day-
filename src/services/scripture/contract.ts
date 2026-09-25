// Request/response shape for the Scripture Guide agent (POST /api/scripture).
// Pure types + validation, no React Native imports, so server/ can import it.

export const BIBLE_LANGUAGES = ['en', 'fr', 'ig', 'he'] as const;
export type BibleLanguage = (typeof BIBLE_LANGUAGES)[number];

export const BIBLE_LANGUAGE_NAMES: Record<BibleLanguage, string> = {
  en: 'English (World English Bible)',
  fr: 'Français (Louis Segond 1910)',
  ig: 'Igbo (Bible Nsọ)',
  he: 'עברית (Old Testament, Leningrad Codex)',
};

export type ScriptureMoment = 'urge' | 'slip' | 'checkin' | 'milestone' | 'chat';

export interface ScriptureRequest {
  moment: ScriptureMoment;
  language: BibleLanguage;
  addiction: { name: string; category: string } | null;
  situation: {
    emotion?: string;
    /** What the person wrote, trimmed on the device. */
    note?: string;
    timeOfDay?: string;
    dayOfWeek?: string;
    streakDays?: number;
    /** Days clean before this slip. */
    streakBeforeSlip?: number;
    bestRunDays?: number;
    slipsLast14Days?: number;
    gentleMode?: boolean;
    milestoneDay?: number;
    mood?: number;
  };
  faithBackground?: string;
  /** e.g. "JHN 21:15". The guide avoids repeating these. */
  recentReferences: string[];
}

export interface ScriptureGuidance {
  reference: { book: string; chapter: number; start: number; end: number; display: string };
  /** Verse text in `textLanguage`, copied from the Bible files, never written by the AI. */
  text: string;
  textLanguage: BibleLanguage;
  /** Present when the requested language wasn't available for this passage. */
  fallbackNote?: string;
  why: string;
  question: string;
  prayer: string;
  readToday: { book: string; chapter: number; display: string };
  nextStep: string;
}

export const SCRIPTURE_LIMITS = { noteChars: 600, recent: 30, stringChars: 120 } as const;

export function validateScriptureRequest(body: unknown): string | null {
  const b = body as Partial<ScriptureRequest>;
  if (!b || typeof b !== 'object') return 'body must be an object';
  if (!['urge', 'slip', 'checkin', 'milestone', 'chat'].includes(b.moment as string)) return 'invalid moment';
  if (!BIBLE_LANGUAGES.includes(b.language as BibleLanguage)) return 'invalid language';
  if (!b.situation || typeof b.situation !== 'object') return 'situation required';
  if (b.situation.note && (typeof b.situation.note !== 'string' || b.situation.note.length > SCRIPTURE_LIMITS.noteChars)) {
    return 'note too long';
  }
  for (const k of ['emotion', 'timeOfDay', 'dayOfWeek'] as const) {
    const v = b.situation[k];
    if (v !== undefined && (typeof v !== 'string' || v.length > SCRIPTURE_LIMITS.stringChars)) return `invalid ${k}`;
  }
  if (!Array.isArray(b.recentReferences) || b.recentReferences.length > SCRIPTURE_LIMITS.recent) return 'invalid recentReferences';
  if (b.recentReferences.some((r) => typeof r !== 'string' || r.length > 20)) return 'invalid reference';
  if (b.faithBackground !== undefined && (typeof b.faithBackground !== 'string' || b.faithBackground.length > 300)) {
    return 'invalid faithBackground';
  }
  if (b.addiction !== null && b.addiction !== undefined) {
    if (typeof b.addiction.name !== 'string' || b.addiction.name.length > 60) return 'invalid addiction';
  }
  return null;
}
