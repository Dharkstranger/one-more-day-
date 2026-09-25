// Compares a language file's chapter and verse counts against the English WEB.
// Differences are normal in a few places (e.g. Psalm titles, Malachi 4) but should be few.
// Usage: node scripts/bible/validate.mjs data/bible/fr-lsg.json [--write]
// With --write, stores the mismatched chapters in the file as `unverified`;
// the app shows English for those chapters instead of risking a wrong verse.
import { readFileSync, writeFileSync } from 'node:fs';

const ref = JSON.parse(readFileSync(new URL('../../data/bible/en-web.json', import.meta.url)));
const b = JSON.parse(readFileSync(process.argv[2]));
let verses = 0, empty = 0;
const diffs = [];
const unverified = [];
// Hebrew Psalms count their titles as verses: English v = Hebrew v + offset.
const offsets = {};
b.books.forEach((book, i) => {
  const rb = ref.books[i];
  if (book.chapters.length !== rb.chapters.length) diffs.push(`${book.code}: ${book.chapters.length} chapters vs ${rb.chapters.length}`);
  book.chapters.forEach((c, j) => {
    verses += c.length;
    empty += c.filter((v) => !v).length;
    const rc = rb.chapters[j];
    if (rc && c.length !== rc.length) {
      const extra = c.length - rc.length;
      if (b.lang === 'he' && book.code === 'PSA' && (extra === 1 || extra === 2)) {
        offsets[`PSA.${j + 1}`] = extra;
        return;
      }
      diffs.push(`${book.code} ${j + 1}: ${c.length} verses vs ${rc.length}`);
      unverified.push(`${book.code}.${j + 1}`);
    }
  });
});
console.log(`${b.name}: ${b.books.length} books, ${verses} verses, ${empty} empty, ${diffs.length} chapter differences`);
console.log(diffs.slice(0, 40).join('\n'));

if (process.argv.includes('--write') && b.lang !== 'en') {
  b.unverified = unverified;
  if (Object.keys(offsets).length) b.offsets = offsets;
  writeFileSync(process.argv[2], JSON.stringify(b));
  console.log(`Marked ${unverified.length} chapters as unverified, ${Object.keys(offsets).length} Psalm offsets.`);
}
