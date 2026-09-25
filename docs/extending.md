# Extending One More Day

The app is built so most changes are one file and no new code. Every section below says exactly which file to edit.

## Add an addiction to the preset list

Edit `src/config/presets.ts` and append:

```ts
{ id: 'energy', name: 'Energy drinks', emoji: '⚡', category: 'substance', intervalDays: 14, costHint: 'e.g. 20' },
```

`category` matters: `substance` turns on the tolerance/overdose warning. People can always type their own name, so presets are just shortcuts.

## Add "things to do instead" or encouragement notes

Edit `COPING_IDEAS` or `SUNSHINE_NOTES` in `src/config/copingIdeas.ts`. Keep ideas concrete and doable in 15 minutes.

## Add Bible verses

1. Add a row to `CURATED` in `scripts/build-scripture-seed.mjs`:
   `['Psalms', 'psalms', 27, 1, 'fear', ['strength']]` (book, file name, chapter, verse, main tag, other tags).
2. Get the source text (World English Bible, public domain):
   ```bash
   npm pack world-english-bible && tar xzf world-english-bible-*.tgz
   npm run build:scriptures -- ./package/json
   ```
3. Commit the regenerated `src/db/seed/scriptures.ts`. Never type verse text by hand.

Tags the app searches for: `temptation`, `craving`, `relapse`, `shame`, `guilt`, `fear`, `anxiety`, `stress`, `loneliness`, `grief`, `hopelessness`, `exhaustion`, `anger`, `boredom`, `strength`, and more (see `src/services/ai/scriptureTags.ts`).

## Another translation, language, or faith

The `scriptures` table has a `translation` column, and matching works only on tags. To add a translation, generate rows with a new `translation` value. Only use texts you're allowed to redistribute. To support another faith tradition, keep the same table and tags with that tradition's texts, and adjust `src/prompts/sponsor.ts`.

## Crisis numbers for your country

Edit `src/config/crisisResources.ts`. Include the source URL in a comment so reviewers can check it.

## Tune the game

`src/services/sunshine/rules.ts` holds ray amounts, levels, the milestone ladder, and gentle-mode thresholds. Run `npm test` after changing.

## Change the words in the app

All interface text is in `src/copy/en.ts`. Before editing, read the voice guide in `.agents/product-marketing.md`. We write with the `copywriting` skill and check with `copy-editing` (both in `.claude/skills/`, MIT, by Corey Haines). To translate the interface, copy `en.ts` to a new language file.

## Add a Bible language

See [bible-data.md](bible-data.md#add-a-language).

## Change how the Scripture Guide chooses

`src/prompts/scriptureGuide.ts`. See [scripture-guide.md](scripture-guide.md).

## Change how the sponsor speaks

`src/prompts/sponsor.ts`. Keep every rule in the "Safety rules" section (see [safety.md](safety.md)).

## Add a screen

Create a file in `src/app/`. It becomes a route automatically. Use `Screen`, `Card`, `Button` from `src/components/ui/` so it matches.

## Plug in from another app

- Read or write the backup format: [data-format.md](data-format.md).
- Call a relay: [api.md](api.md).

## Ideas we have not built

Good first contributions:

- PIN / Face ID lock
- Other languages for the whole interface
- Apple Watch / Wear OS "I'm struggling" button (the API is ready)
- Links to device-level content blockers for porn and gambling
- The community feature: [community-design.md](community-design.md)
- More crisis lines by country
