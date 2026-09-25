// The 66 books in canonical order: [code, English name, world-english-bible file name].
// PDF sources number their files 1–66 in this same order.
export const BOOKS = [
  ['GEN', 'Genesis', 'genesis'], ['EXO', 'Exodus', 'exodus'], ['LEV', 'Leviticus', 'leviticus'],
  ['NUM', 'Numbers', 'numbers'], ['DEU', 'Deuteronomy', 'deuteronomy'], ['JOS', 'Joshua', 'joshua'],
  ['JDG', 'Judges', 'judges'], ['RUT', 'Ruth', 'ruth'], ['1SA', '1 Samuel', '1samuel'], ['2SA', '2 Samuel', '2samuel'],
  ['1KI', '1 Kings', '1kings'], ['2KI', '2 Kings', '2kings'], ['1CH', '1 Chronicles', '1chronicles'],
  ['2CH', '2 Chronicles', '2chronicles'], ['EZR', 'Ezra', 'ezra'], ['NEH', 'Nehemiah', 'nehemiah'],
  ['EST', 'Esther', 'esther'], ['JOB', 'Job', 'job'], ['PSA', 'Psalms', 'psalms'], ['PRO', 'Proverbs', 'proverbs'],
  ['ECC', 'Ecclesiastes', 'ecclesiastes'], ['SNG', 'Song of Solomon', 'songofsolomon'], ['ISA', 'Isaiah', 'isaiah'],
  ['JER', 'Jeremiah', 'jeremiah'], ['LAM', 'Lamentations', 'lamentations'], ['EZK', 'Ezekiel', 'ezekiel'],
  ['DAN', 'Daniel', 'daniel'], ['HOS', 'Hosea', 'hosea'], ['JOL', 'Joel', 'joel'], ['AMO', 'Amos', 'amos'],
  ['OBA', 'Obadiah', 'obadiah'], ['JON', 'Jonah', 'jonah'], ['MIC', 'Micah', 'micah'], ['NAM', 'Nahum', 'nahum'],
  ['HAB', 'Habakkuk', 'habakkuk'], ['ZEP', 'Zephaniah', 'zephaniah'], ['HAG', 'Haggai', 'haggai'],
  ['ZEC', 'Zechariah', 'zechariah'], ['MAL', 'Malachi', 'malachi'], ['MAT', 'Matthew', 'matthew'],
  ['MRK', 'Mark', 'mark'], ['LUK', 'Luke', 'luke'], ['JHN', 'John', 'john'], ['ACT', 'Acts', 'acts'],
  ['ROM', 'Romans', 'romans'], ['1CO', '1 Corinthians', '1corinthians'], ['2CO', '2 Corinthians', '2corinthians'],
  ['GAL', 'Galatians', 'galatians'], ['EPH', 'Ephesians', 'ephesians'], ['PHP', 'Philippians', 'philippians'],
  ['COL', 'Colossians', 'colossians'], ['1TH', '1 Thessalonians', '1thessalonians'],
  ['2TH', '2 Thessalonians', '2thessalonians'], ['1TI', '1 Timothy', '1timothy'], ['2TI', '2 Timothy', '2timothy'],
  ['TIT', 'Titus', 'titus'], ['PHM', 'Philemon', 'philemon'], ['HEB', 'Hebrews', 'hebrews'], ['JAS', 'James', 'james'],
  ['1PE', '1 Peter', '1peter'], ['2PE', '2 Peter', '2peter'], ['1JN', '1 John', '1john'], ['2JN', '2 John', '2john'],
  ['3JN', '3 John', '3john'], ['JUD', 'Jude', 'jude'], ['REV', 'Revelation', 'revelation'],
];

/** Output shape shared by every language file in data/bible/. See docs/bible-data.md. */
export function emptyBible(meta) {
  return { ...meta, books: [] };
}

export function writeBible(path, bible) {
  return import('node:fs').then(({ writeFileSync }) => writeFileSync(path, JSON.stringify(bible)));
}
