# Architecture

```
┌──────────────────────── Device (phone or browser) ────────────────────────┐
│  Screens (src/app, Expo Router)                                            │
│     │                                                                      │
│  Hooks (src/hooks) ── Actions (src/services/actions.ts)                     │
│     │                     │                                                │
│  Pure logic (src/services/recovery, sunshine, ai/scriptureTags, crisis)    │
│     │                                                                      │
│  SQLite (src/db) ── on phones: native SQLite; in browsers: SQLite (WASM)    │
└──────────────────────────────┬─────────────────────────────────────────────┘
                               │ only when the person talks to the sponsor
                               ▼
                 Relay (server/ → api/ on Vercel)
                 sponsor.ts: chat · scriptureGuide.ts: Bible agent · bible.ts: 4 Bibles
                               │ holds ANTHROPIC_API_KEY, stores nothing
                               ▼
                        Anthropic Messages API
```

## Folders

| Folder | What's in it |
|---|---|
| `src/app/` | One file per screen (Expo Router). `_layout.tsx` loads fonts and the database. |
| `src/components/` | Reusable UI. `ui/` holds the design system (Screen, Card, Button, Chip, Field, Text). |
| `src/db/` | Schema (`schema.ts`), migrations (`migrate.ts`), seed verses, and one file per table in `repo/`. |
| `src/services/recovery/` | Streaks, milestone wording, risk patterns. Pure functions, unit tested. |
| `src/services/sunshine/` | Rays, levels, weather, tracker stats. Pure functions, unit tested. |
| `src/services/ai/` | Crisis check, verse matching, request contract, relay client. |
| `src/services/location/`, `notifications/`, `backup/` | Platform code. `*.native.ts` runs on phones, the plain `.ts` file runs on web. |
| `src/config/` | Things contributors are expected to edit: presets, coping ideas, crisis numbers. |
| `src/prompts/` | The sponsor's and the Scripture Guide's instructions. |
| `src/copy/en.ts` | Every word the interface shows. Voice rules: `.agents/product-marketing.md`. |
| `src/components/motion/` | Animation building blocks: `Appear`, `PressScale`, `CountUp`, `Celebration` (ray bursts, level-up sunrise). All respect "reduce motion". |
| `src/services/scripture/` | Scripture Guide contract, client, language preference. |
| `data/bible/` | The full Bible in English, French, Igbo and Hebrew. See [bible-data.md](bible-data.md). |
| `server/` | The relay: `sponsor.ts`, `scriptureGuide.ts` (agent loop), `bible.ts` (search and read). Plain Web `Request → Response` handlers. |
| `api/` | Vercel wrappers around `server/`. |
| `scripts/` | Verse seed builder, web post-build step. |
| `test/` | Unit tests (`npm test`). |

## Platform differences

| Capability | Phone | Web |
|---|---|---|
| Storage | Native SQLite | SQLite compiled to WebAssembly (needs the COOP/COEP headers in `vercel.json`) |
| Risky-place alerts | Yes (background geofencing) | No |
| "Hard time coming" nudges | Scheduled local notifications | No (browser can't schedule) |
| Daily reminder | Google Calendar link | Google Calendar link |
| Backup | Share sheet | File download |

## Database

Seven tables. v1 (the original spec) is unchanged; v2 added three:

- `addictions`, `logs`, `user_profile`, `danger_zones`, `scriptures` (v1)
- `addiction_details`, `checkins`, `rays` (v2)

Full column list: [data-format.md](data-format.md). Migrations run in order using SQLite's `PRAGMA user_version`. Never edit a shipped migration; append a new one.

## Rules of thumb for contributors

- Put new rules in pure functions under `src/services/` and test them.
- Screens call `src/services/actions.ts`, not several repos directly, when an action touches more than one table.
- Anything that leaves the device goes through `src/services/ai/buildContext.ts`. Keep that list small. See [privacy.md](privacy.md).

## Motion

Animations use Reanimated. Two rules learned the hard way:
- NativeWind `className` doesn't style Reanimated (or React Native `Animated`) views. Put classes on an inner plain view, or use `style` on the animated one. `PressScale` shows the pattern.
- Every animation checks `useReducedMotion()` and turns itself off when the device asks.
