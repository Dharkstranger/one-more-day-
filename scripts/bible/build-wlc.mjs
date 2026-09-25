// Hebrew Old Testament: Westminster Leningrad Codex (text in the public domain),
// from the Open Scriptures Hebrew Bible project (https://github.com/openscriptures/morphhb).
// Keeps vowel points (niqqud), removes cantillation marks and morpheme dividers.
// Usage: node scripts/bible/build-wlc.mjs   (downloads the 39 OSIS files)
import { BOOKS, writeBible } from './books.mjs';

const OSIS = {
  GEN: 'Gen', EXO: 'Exod', LEV: 'Lev', NUM: 'Num', DEU: 'Deut', JOS: 'Josh', JDG: 'Judg', RUT: 'Ruth',
  '1SA': '1Sam', '2SA': '2Sam', '1KI': '1Kgs', '2KI': '2Kgs', '1CH': '1Chr', '2CH': '2Chr', EZR: 'Ezra',
  NEH: 'Neh', EST: 'Esth', JOB: 'Job', PSA: 'Ps', PRO: 'Prov', ECC: 'Eccl', SNG: 'Song', ISA: 'Isa',
  JER: 'Jer', LAM: 'Lam', EZK: 'Ezek', DAN: 'Dan', HOS: 'Hos', JOL: 'Joel', AMO: 'Amos', OBA: 'Obad',
  JON: 'Jonah', MIC: 'Mic', NAM: 'Nah', HAB: 'Hab', ZEP: 'Zeph', HAG: 'Hag', ZEC: 'Zech', MAL: 'Mal',
};
const HE_NAMES = {
  GEN: 'בראשית', EXO: 'שמות', LEV: 'ויקרא', NUM: 'במדבר', DEU: 'דברים', JOS: 'יהושע', JDG: 'שופטים', RUT: 'רות',
  '1SA': 'שמואל א', '2SA': 'שמואל ב', '1KI': 'מלכים א', '2KI': 'מלכים ב', '1CH': 'דברי הימים א', '2CH': 'דברי הימים ב',
  EZR: 'עזרא', NEH: 'נחמיה', EST: 'אסתר', JOB: 'איוב', PSA: 'תהלים', PRO: 'משלי', ECC: 'קהלת', SNG: 'שיר השירים',
  ISA: 'ישעיהו', JER: 'ירמיהו', LAM: 'איכה', EZK: 'יחזקאל', DAN: 'דניאל', HOS: 'הושע', JOL: 'יואל', AMO: 'עמוס',
  OBA: 'עובדיה', JON: 'יונה', MIC: 'מיכה', NAM: 'נחום', HAB: 'חבקוק', ZEP: 'צפניה', HAG: 'חגי', ZEC: 'זכריה', MAL: 'מלאכי',
};
const BASE = 'https://raw.githubusercontent.com/openscriptures/morphhb/master/wlc/';

const stripMarks = (s) =>
  s
    .replace(/[֑-ֽ֯]/g, '') // cantillation and meteg
    .replace(/\//g, ''); // morpheme dividers

function parseVerse(xml) {
  const body = xml.replace(/<note\b[\s\S]*?<\/note>/g, '');
  let out = '';
  for (const m of body.matchAll(/<(w|seg)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const text = stripMarks(m[2].replace(/<[^>]+>/g, ''));
    if (m[1] === 'seg') out += text; // maqaf, sof pasuq: attach without a space
    else out += (out && !out.endsWith('־') ? ' ' : '') + text;
  }
  return out.replace(/\s+/g, ' ').trim();
}

const bible = {
  lang: 'he',
  translation: 'WLC',
  name: 'Westminster Leningrad Codex (Old Testament)',
  license: 'Public domain (text); https://github.com/openscriptures/morphhb',
  source: 'Open Scriptures Hebrew Bible (morphhb), wlc/*.xml',
  books: [],
};

for (const [code] of BOOKS) {
  if (!OSIS[code]) {
    bible.books.push({ code, name: '', chapters: [] }); // New Testament: not available in this source
    continue;
  }
  const res = await fetch(`${BASE}${OSIS[code]}.xml`);
  if (!res.ok) throw new Error(`${code}: HTTP ${res.status}`);
  const xml = await res.text();
  const chapters = [];
  for (const m of xml.matchAll(/<verse osisID="[^.]+\.(\d+)\.(\d+)"[^>]*>([\s\S]*?)<\/verse>/g)) {
    const [c, v] = [Number(m[1]), Number(m[2])];
    (chapters[c - 1] ??= [])[v - 1] = parseVerse(m[3]);
  }
  bible.books.push({ code, name: HE_NAMES[code], chapters: chapters.map((c) => Array.from(c ?? [], (x) => x ?? '')) });
  process.stdout.write(`${code} `);
}
await writeBible(new URL('../../data/bible/he-wlc.json', import.meta.url), bible);
console.log('\nWrote data/bible/he-wlc.json');
