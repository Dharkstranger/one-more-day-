import type { SQLiteDatabase } from 'expo-sqlite';
import { getProfileValue, setProfileValue, SETTING_PREFIX } from '../../db/repo/profile';
import { BIBLE_LANGUAGES, type BibleLanguage } from './contract';

const LANG_KEY = `${SETTING_PREFIX}bible_language`;
const RECENT_KEY = `${SETTING_PREFIX}recent_passages`;

/** Translation code stored in the scriptures table for each Bible language. */
export const TRANSLATION_FOR: Record<BibleLanguage, string> = { en: 'WEB', fr: 'LSG', ig: 'IGBO', he: 'WLC' };

export async function getBibleLanguage(db: SQLiteDatabase): Promise<BibleLanguage> {
  const v = await getProfileValue(db, LANG_KEY);
  return BIBLE_LANGUAGES.includes(v as BibleLanguage) ? (v as BibleLanguage) : 'en';
}

export const setBibleLanguage = (db: SQLiteDatabase, lang: BibleLanguage) => setProfileValue(db, LANG_KEY, lang);

/** Passages the guide gave recently (e.g. "JHN 21:15"), newest first, so it doesn't repeat itself. */
export async function getRecentPassages(db: SQLiteDatabase): Promise<string[]> {
  try {
    const v = JSON.parse((await getProfileValue(db, RECENT_KEY)) ?? '[]');
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, 30) : [];
  } catch {
    return [];
  }
}

export async function rememberPassage(db: SQLiteDatabase, ref: string): Promise<void> {
  const list = [ref, ...(await getRecentPassages(db)).filter((r) => r !== ref)].slice(0, 30);
  await setProfileValue(db, RECENT_KEY, JSON.stringify(list));
}
