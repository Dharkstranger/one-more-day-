# Bible data

The full Bible in four languages lives in `data/bible/`. The Scripture Guide agent searches and reads it on the server, and a smaller set of verses is stored on each phone for offline use.

## Sources and licences

| File | Language | Translation | Coverage | Licence | Source |
|---|---|---|---|---|---|
| `en-web.json` | English | World English Bible (WEB) | Whole Bible, 31,103 verses | Public domain | [ebible.org/web](https://ebible.org/web/), via npm package `world-english-bible` |
| `fr-lsg.json` | French | Louis Segond 1910 | Whole Bible, 31,102 verses | Public domain | WordProject ([wordproject.org](https://www.wordproject.org)) PDFs supplied by the project owner |
| `ig.json` | Igbo | Bible Nsọ (early Union Igbo Bible) | Whole Bible, 31,104 verses | Public domain (as stated by the project owner) | WordProject PDFs supplied by the project owner |
| `he-wlc.json` | Hebrew | Westminster Leningrad Codex | Old Testament, 23,213 verses | Text in the public domain | [Open Scriptures Hebrew Bible](https://github.com/openscriptures/morphhb) |

**Note on WordProject:** the French and Igbo PDFs carry WordProject's name. The underlying translations are old enough to be public domain, but WordProject's own terms of use are worth reading before redistributing large volumes: https://www.wordproject.org. If in doubt, rebuild from another public-domain copy with the same scripts.

**Hebrew New Testament:** not included yet. The supplied Hebrew PDF's text layer was damaged, and no clean public copy of Delitzsch's 1877 translation was reachable when this was built. Hebrew readers see New Testament passages in English, with a note. A clean Delitzsch file, converted to the format below, is welcome.

## Format

```json
{
  "lang": "fr",
  "translation": "LSG",
  "name": "Louis Segond 1910",
  "license": "Public domain",
  "source": "…",
  "books": [{ "code": "GEN", "name": "Genèse", "chapters": [["Au commencement, Dieu créa…", "…"], "…"] }],
  "unverified": ["ROM.14", "ROM.16"],
  "offsets": { "PSA.51": 2 }
}
```

- 66 books in canonical order with 3-letter codes (`GEN` … `REV`), listed in `scripts/bible/books.mjs`.
- `chapters[c-1][v-1]` is the text of chapter c, verse v.
- **Verse numbers follow English (WEB).** Where a language's chapter has a different number of verses, the chapter is listed in `unverified`, and the app shows English for it instead of risking the wrong verse.
- **Hebrew Psalms** count their titles as verses. `offsets` maps them: English verse v = Hebrew verse v + offset.

## Quality checks

`node scripts/bible/validate.mjs <file>` compares every chapter's verse count with English.

| File | Chapters differing from English | Why |
|---|---|---|
| French | 2 (Romans 14, 16) | Where the closing doxology sits differs between traditions |
| Igbo | 10 | Mostly problems in the source file itself. For example, the Igbo PDF's Genesis 3 repeats Genesis 1. |
| Hebrew | 48 Old Testament chapters (+ 62 Psalms mapped by offset) | Hebrew and English divide some chapters differently (e.g. Malachi 3–4, Joel 2–3) |

All of these fall back to English automatically.

## Rebuild

```bash
# English
npm pack world-english-bible && tar xzf world-english-bible-*.tgz
node scripts/bible/build-web.mjs ./package/json

# French / Igbo, from folders of 1.pdf … 66.pdf
node scripts/bible/build-pdf.mjs ./French fr LSG "Louis Segond 1910" data/bible/fr-lsg.json
node scripts/bible/build-pdf.mjs ./Igbo ig IGBO "Bible Nsọ (Igbo)" data/bible/ig.json

# Hebrew (downloads from GitHub)
node scripts/bible/build-wlc.mjs

# Check, and record unverified chapters / Psalm offsets
node scripts/bible/validate.mjs data/bible/fr-lsg.json --write

# Refresh the offline verse set on phones
npm run build:scriptures
```

## Add a language

1. Produce `data/bible/<lang>-<code>.json` in the format above, from a text you're allowed to share.
2. Run `validate.mjs --write` on it.
3. Add the language to `BIBLE_LANGUAGES` in `src/services/scripture/contract.ts`, the file name in `server/bible.ts`, and its translation code in `src/services/scripture/prefs.ts` and `scripts/build-scripture-seed.mjs`.
