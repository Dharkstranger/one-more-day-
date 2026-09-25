// The whole Bible in four languages, loaded from data/bible/*.json (see docs/bible-data.md).
// Search runs over the English text; any passage can then be read in any language.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { BibleLanguage } from '../src/services/scripture/contract';

interface BibleFile {
  lang: string;
  translation: string;
  name: string;
  books: { code: string; name: string; chapters: string[][] }[];
  /** "BOOK.CHAPTER" whose verse numbering didn't match English; shown in English instead. */
  unverified?: string[];
  /** Hebrew Psalms: English verse v is Hebrew verse v + offset. */
  offsets?: Record<string, number>;
}

const FILES: Record<BibleLanguage, string> = { en: 'en-web.json', fr: 'fr-lsg.json', ig: 'ig.json', he: 'he-wlc.json' };
const cache = new Map<BibleLanguage, BibleFile>();

function dataDir(): string {
  return process.env.BIBLE_DATA_DIR || join(process.cwd(), 'data', 'bible');
}

export function loadBible(lang: BibleLanguage): BibleFile {
  let b = cache.get(lang);
  if (!b) {
    b = JSON.parse(readFileSync(join(dataDir(), FILES[lang]), 'utf8')) as BibleFile;
    cache.set(lang, b);
  }
  return b;
}

export const BOOK_CODES = (): string[] => loadBible('en').books.map((b) => b.code);

export function bookName(lang: BibleLanguage, code: string): string {
  const b = loadBible(lang).books.find((x) => x.code === code);
  return b?.name || loadBible('en').books.find((x) => x.code === code)?.name || code;
}

export function chapterCount(code: string): number {
  return loadBible('en').books.find((b) => b.code === code)?.chapters.length ?? 0;
}

export function verseCount(code: string, chapter: number): number {
  return loadBible('en').books.find((b) => b.code === code)?.chapters[chapter - 1]?.length ?? 0;
}

/**
 * Verses start..end of a chapter, using English verse numbers.
 * Falls back to English when the language lacks the book or the chapter is unverified.
 */
export function readVerses(
  lang: BibleLanguage,
  code: string,
  chapter: number,
  start: number,
  end: number,
): { lang: BibleLanguage; verses: { n: number; text: string }[] } | null {
  const max = verseCount(code, chapter);
  if (!max || start < 1 || start > end || end > max) return null;

  const b = loadBible(lang);
  const key = `${code}.${chapter}`;
  const ch = b.books.find((x) => x.code === code)?.chapters[chapter - 1];
  const usable = lang === 'en' || (ch && ch.length > 0 && !b.unverified?.includes(key));
  const source: BibleLanguage = usable ? lang : 'en';
  const chapterText = source === 'en' ? loadBible('en').books.find((x) => x.code === code)!.chapters[chapter - 1] : ch!;
  const offset = source === lang ? (b.offsets?.[key] ?? 0) : 0;

  const verses = [];
  for (let n = start; n <= end; n++) verses.push({ n, text: chapterText[n - 1 + offset] ?? '' });
  if (verses.some((v) => !v.text)) {
    if (source === 'en') return { lang: 'en', verses };
    return readVerses('en', code, chapter, start, end);
  }
  return { lang: source, verses };
}

// ---------- Search (English) ----------

const STOP = new Set(
  'a an and are as at be but by for from he her him his i in is it its me my of on or our she so that the their them they this to was we were will with you your not no all who which what when shall have has had do did unto thee thou thy ye'.split(
    ' ',
  ),
);

const stem = (w: string) => w.replace(/(ings|ing|edly|ed|es|s)$/, '');

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z']+/g) ?? []).map((w) => w.replace(/'/g, '')).filter((w) => w.length > 2 && !STOP.has(w)).map(stem);
}

interface Doc {
  ref: string;
  code: string;
  chapter: number;
  verse: number;
  len: number;
}

let index: { docs: Doc[]; postings: Map<string, [number, number][]>; avgLen: number } | null = null;

function buildIndex() {
  const docs: Doc[] = [];
  const postings = new Map<string, [number, number][]>();
  let total = 0;
  for (const book of loadBible('en').books) {
    book.chapters.forEach((ch, ci) =>
      ch.forEach((text, vi) => {
        if (!text) return;
        const toks = tokenize(text);
        const id = docs.length;
        docs.push({ ref: `${book.code} ${ci + 1}:${vi + 1}`, code: book.code, chapter: ci + 1, verse: vi + 1, len: toks.length });
        total += toks.length;
        const tf = new Map<string, number>();
        for (const t of toks) tf.set(t, (tf.get(t) ?? 0) + 1);
        for (const [t, f] of tf) {
          let list = postings.get(t);
          if (!list) postings.set(t, (list = []));
          list.push([id, f]);
        }
      }),
    );
  }
  return { docs, postings, avgLen: total / docs.length };
}

const NT_START = 'MAT';

/** BM25 keyword search. Returns the best-matching verses with their English text. */
export function searchBible(query: string, opts: { testament?: 'OT' | 'NT' | 'any'; limit?: number } = {}) {
  index ??= buildIndex();
  const { docs, postings, avgLen } = index;
  const codes = BOOK_CODES();
  const ntIndex = codes.indexOf(NT_START);
  const k1 = 1.4;
  const b = 0.7;
  const scores = new Map<number, number>();
  for (const term of new Set(tokenize(query))) {
    const list = postings.get(term);
    if (!list) continue;
    const idf = Math.log(1 + (docs.length - list.length + 0.5) / (list.length + 0.5));
    for (const [id, f] of list) {
      const d = docs[id];
      const s = idf * ((f * (k1 + 1)) / (f + k1 * (1 - b + (b * d.len) / avgLen)));
      scores.set(id, (scores.get(id) ?? 0) + s);
    }
  }
  const testament = opts.testament ?? 'any';
  const en = loadBible('en');
  return [...scores.entries()]
    .filter(([id]) => {
      if (testament === 'any') return true;
      const nt = codes.indexOf(docs[id].code) >= ntIndex;
      return testament === 'NT' ? nt : !nt;
    })
    .sort((x, y) => y[1] - x[1])
    .slice(0, Math.min(opts.limit ?? 12, 25))
    .map(([id]) => {
      const d = docs[id];
      return { ref: d.ref, text: en.books.find((x) => x.code === d.code)!.chapters[d.chapter - 1][d.verse - 1] };
    });
}
