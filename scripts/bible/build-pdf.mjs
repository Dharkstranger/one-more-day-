// French and Igbo: one PDF per book (1.pdf … 66.pdf), each with chapter headings
// like "CHAPITRE 3" / "ISI 3" and verses that start with their number.
// Usage: node scripts/bible/build-pdf.mjs <pdf dir> <lang> <translation code> "<name>" <out file>
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { join } from 'node:path';
import { BOOKS, writeBible } from './books.mjs';

const [dir, lang, translation, name, out] = process.argv.slice(2);
if (!out) throw new Error('Usage: node scripts/bible/build-pdf.mjs <dir> <lang> <code> "<name>" <out>');

async function pdfItems(file) {
  const doc = await getDocument({ url: file, useSystemFonts: true, verbosity: 0 }).promise;
  const items = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const content = await (await doc.getPage(p)).getTextContent();
    for (const it of content.items) items.push({ str: it.str, x: it.transform[4], y: it.transform[5], page: p });
  }
  return { title: (await doc.getMetadata()).info.Title, items };
}

// A chapter heading is one fragment like "CHAPITRE 3", "ISI 3", "PSAUME 3".
const HEADING = /^\s*\p{Lu}[\p{Lu}\p{M}'’ ]*\s(\d{1,3})\s*$/u;
const NUMBER = /^\d{1,3}$/;
const bible = { lang, translation, name, license: 'Public domain', source: 'WordProject (wordproject.org) PDFs, one per book, supplied by the project owner', books: [] };

for (let i = 0; i < BOOKS.length; i++) {
  const [code] = BOOKS[i];
  const { title, items } = await pdfItems(join(dir, `${i + 1}.pdf`));
  const margin = Math.min(...items.filter((it) => it.str.trim()).map((it) => it.x)) + 4;
  const chapters = [];
  let ch = null;
  let verse = 0;
  let prev = null;
  for (let k = 0; k < items.length; k++) {
    const it = items[k];
    const text = it.str;
    if (!text.trim()) continue;
    const h = text.match(HEADING);
    if (h && Number(h[1]) === chapters.length + 1) {
      ch = [];
      chapters.push(ch);
      verse = 0;
      prev = null;
      continue;
    }
    if (!ch) continue;
    // Verse number: a bare number at the left margin, the next verse or a small gap
    // (some sources skip a number; the skipped verses are left empty).
    const n = Number(text.trim());
    if (NUMBER.test(text.trim()) && it.x <= margin && verse > 0 && n > verse && n <= verse + 3) {
      // A gap straight after the unnumbered opening verse means that opening text
      // was really verse n-1 (the source dropped verse 1 into the heading).
      if (verse === 1 && n > 2) {
        ch[n - 2] = ch[0];
        ch[0] = '';
        for (let k = 1; k < n - 2; k++) ch[k] = '';
        verse = n - 1;
      }
      while (verse < n - 1) ch[verse++] = '';
      verse = n;
      ch[verse - 1] = '';
      prev = it;
      continue;
    }
    if (verse === 0) {
      verse = 1;
      ch[0] = '';
    }
    // Drop cap: "A" + "u commencement" on the same baseline joins without a space.
    const soFar = ch[verse - 1].trim();
    const joinTight = prev && /^\p{Lu}$/u.test(soFar) && Math.abs(prev.y - it.y) < 3;
    ch[verse - 1] = joinTight ? soFar + text : ch[verse - 1] + ' ' + text;
    prev = it;
  }
  const clean = (v) =>
    (v ?? '')
      .replace(/For other languages please go to www\.wordproject\.org/gi, '')
      // Alternate (Hebrew) verse numbers the source prints inline, e.g. "(7:26)".
      .replace(/\(\d+[:.]\d+\)\s*/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      // Drop cap followed by an apostrophe: "L' Éternel" → "L'Éternel".
      .replace(/^(\p{L}{1,2})([’']) (?=\p{L})/u, '$1$2');
  bible.books.push({ code, name: title, chapters: chapters.map((c) => c.map(clean)) });
  process.stdout.write(`${code} `);
}
await writeBible(out, bible);
console.log(`\nWrote ${out}`);
