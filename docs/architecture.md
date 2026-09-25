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
                 Relay (server/sponsor.ts → api/sponsor.ts on Vercel)
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
| `src/prompts/` | The sponsor's instructions. |
| `server/` | The relay. Plain Web `Request → Response` handler. |
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
