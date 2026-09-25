// English: World English Bible (public domain) from the `world-english-bible` npm package.
// Usage: npm pack world-english-bible && tar xzf world-english-bible-*.tgz
//        node scripts/bible/build-web.mjs ./package/json
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { BOOKS, writeBible } from './books.mjs';

const dir = process.argv[2];
if (!dir) throw new Error('Usage: node scripts/bible/build-web.mjs <world-english-bible/json dir>');

const bible = {
  lang: 'en',
  translation: 'WEB',
  name: 'World English Bible',
  license: 'Public domain',
  source: 'https://ebible.org/web/ (via npm package world-english-bible)',
  books: [],
};

for (const [code, name, file] of BOOKS) {
  const nodes = JSON.parse(readFileSync(join(dir, `${file}.json`), 'utf8'));
  const chapters = [];
  for (const n of nodes) {
    if (typeof n.value !== 'string' || !n.chapterNumber || !n.verseNumber) continue;
    const ch = (chapters[n.chapterNumber - 1] ??= []);
    ch[n.verseNumber - 1] = ((ch[n.verseNumber - 1] ?? '') + ' ' + n.value).replace(/\s+/g, ' ').trim();
  }
  bible.books.push({ code, name, chapters: chapters.map((c) => Array.from(c ?? [], (v) => v ?? '')) });
}
await writeBible(new URL('../../data/bible/en-web.json', import.meta.url), bible);
console.log('Wrote data/bible/en-web.json');
