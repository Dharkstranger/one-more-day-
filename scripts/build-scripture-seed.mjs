// Builds src/db/seed/scriptures.ts: the verses stored on the device for offline use,
// in every Bible language in data/bible/ (see docs/bible-data.md).
//
// Usage: npm run build:scriptures
//
// Verse text is copied exactly from the Bible files; only the tags below are ours.
// To add a verse: add a row to CURATED, re-run the script, commit the output.
import { readFileSync, writeFileSync } from 'node:fs';

const BIBLES = [
  ['en-web.json', 'WEB'],
  ['fr-lsg.json', 'LSG'],
  ['ig.json', 'IGBO'],
  ['he-wlc.json', 'WLC'],
].map(([file, translation]) => ({
  translation,
  data: JSON.parse(readFileSync(new URL(`../data/bible/${file}`, import.meta.url), 'utf8')),
}));
const CODE = Object.fromEntries(BIBLES[0].data.books.map((b) => [b.name.toLowerCase().replace(/\s+/g, ''), b.code]));
CODE.psalms = 'PSA';
CODE.songofsolomon = 'SNG';

// [display book name, file name, chapter, verse, primary tag, secondary tags]
const CURATED = [
  ['1 Corinthians', '1corinthians', 10, 13, 'temptation', ['strength', 'craving']],
  ['James', 'james', 4, 7, 'temptation', ['strength', 'craving']],
  ['1 Peter', '1peter', 5, 8, 'temptation', ['vigilance']],
  ['Hebrews', 'hebrews', 4, 15, 'temptation', ['shame']],
  ['Galatians', 'galatians', 5, 1, 'temptation', ['freedom']],
  ['Proverbs', 'proverbs', 25, 28, 'craving', ['self_control']],
  ['Titus', 'titus', 2, 12, 'craving', ['self_control']],
  ['Philippians', 'philippians', 4, 8, 'boredom', ['craving', 'mind']],
  ['Romans', 'romans', 12, 2, 'boredom', ['habit', 'mind']],
  ['Romans', 'romans', 8, 1, 'shame', ['guilt', 'relapse']],
  ['Hebrews', 'hebrews', 4, 16, 'shame', ['relapse']],
  ['Luke', 'luke', 15, 20, 'shame', ['relapse', 'guilt']],
  ['2 Corinthians', '2corinthians', 12, 9, 'weakness', ['shame', 'strength']],
  ['1 John', '1john', 1, 9, 'guilt', ['relapse', 'shame']],
  ['Psalms', 'psalms', 51, 10, 'guilt', ['relapse']],
  ['Proverbs', 'proverbs', 24, 16, 'relapse', ['hope']],
  ['Micah', 'micah', 7, 8, 'relapse', ['shame', 'hope']],
  ['2 Corinthians', '2corinthians', 5, 17, 'relapse', ['hope', 'identity']],
  ['Lamentations', 'lamentations', 3, 22, 'relapse', ['hope', 'guilt']],
  ['Lamentations', 'lamentations', 3, 23, 'relapse', ['hope']],
  ['Psalms', 'psalms', 40, 2, 'hopelessness', ['relapse']],
  ['Psalms', 'psalms', 34, 18, 'hopelessness', ['grief', 'loneliness']],
  ['Psalms', 'psalms', 147, 3, 'grief', ['hurt']],
  ['Psalms', 'psalms', 23, 4, 'fear', ['grief']],
  ['Isaiah', 'isaiah', 41, 10, 'fear', ['anxiety', 'strength']],
  ['Joshua', 'joshua', 1, 9, 'fear', ['strength']],
  ['Deuteronomy', 'deuteronomy', 31, 6, 'fear', ['loneliness']],
  ['2 Timothy', '2timothy', 1, 7, 'fear', ['self_control']],
  ['Philippians', 'philippians', 4, 6, 'anxiety', ['stress']],
  ['Philippians', 'philippians', 4, 7, 'anxiety', ['peace']],
  ['1 Peter', '1peter', 5, 7, 'anxiety', ['stress']],
  ['Matthew', 'matthew', 11, 28, 'stress', ['exhaustion', 'rest']],
  ['John', 'john', 16, 33, 'stress', ['hope']],
  ['Isaiah', 'isaiah', 40, 31, 'exhaustion', ['weakness', 'strength']],
  ['Galatians', 'galatians', 6, 9, 'exhaustion', ['perseverance']],
  ['Hebrews', 'hebrews', 12, 1, 'perseverance', ['temptation']],
  ['Philippians', 'philippians', 4, 13, 'strength', ['weakness']],
  ['Ecclesiastes', 'ecclesiastes', 4, 10, 'loneliness', ['community']],
  ['Ephesians', 'ephesians', 4, 26, 'anger', []],
  ['James', 'james', 1, 19, 'anger', []],
  ['Proverbs', 'proverbs', 3, 5, 'confusion', ['trust']],
  ['Psalms', 'psalms', 139, 23, 'confusion', ['self_examination']],
  ['Ephesians', 'ephesians', 5, 18, 'craving', ['alcohol']],
  ['Proverbs', 'proverbs', 20, 1, 'craving', ['alcohol']],
  ['1 Corinthians', '1corinthians', 6, 12, 'habit', ['digital', 'behavioral']],
  ['Psalms', 'psalms', 101, 3, 'temptation', ['digital', 'pornography']],
  ['Job', 'job', 31, 1, 'temptation', ['pornography']],
];

/** Exact text from one Bible file, honouring its unverified chapters and Psalm offsets. Null if unavailable. */
function verseText({ data }, code, chapter, verse) {
  const key = `${code}.${chapter}`;
  if (data.unverified?.includes(key)) return null;
  const ch = data.books.find((b) => b.code === code)?.chapters[chapter - 1];
  const text = ch?.[verse - 1 + (data.offsets?.[key] ?? 0)];
  return text ? text.trim() : null;
}

const rows = [];
for (const [book, file, chapter, verse, primary, secondary] of CURATED) {
  const code = CODE[file];
  if (!code) throw new Error(`Unknown book file name: ${file}`);
  for (const bible of BIBLES) {
    const text = verseText(bible, code, chapter, verse);
    if (!text) {
      if (bible.translation === 'WEB') throw new Error(`Verse not found: ${code} ${chapter}:${verse}`);
      continue; // not available in this language; the app falls back to English
    }
    const name = bible.data.books.find((b) => b.code === code).name || book;
    rows.push({
      id: bible.translation === 'WEB' ? `web-${file}-${chapter}-${verse}` : `${bible.translation.toLowerCase()}-${file}-${chapter}-${verse}`,
      book: name,
      chapter,
      verse,
      text,
      translation: bible.translation,
      primary_emotion_tag: primary,
      secondary_tags: secondary.join(','),
    });
  }
}

const out = `// GENERATED by scripts/build-scripture-seed.mjs. Do not edit by hand.
// Sources and licences: docs/bible-data.md
import type { ScriptureRow } from '../types';

export const SCRIPTURE_SEED: ScriptureRow[] = ${JSON.stringify(rows, null, 2)};
`;
writeFileSync(new URL('../src/db/seed/scriptures.ts', import.meta.url), out);
console.log(`Wrote ${rows.length} verses.`);
