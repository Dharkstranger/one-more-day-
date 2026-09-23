# One More Day

A free, anonymous app for people fighting addiction. You track what you are trying to stay away from, log urges and slips, and get support from an AI companion that answers with plain encouragement and a Bible verse picked for what you are going through.

**Not medical care.** If you are in danger, call your local emergency number. US: call or text **988**, or SAMHSA's free helpline **1-800-662-4357** ([samhsa.gov](https://www.samhsa.gov/find-help/national-helpline)).

## How it works

| Idea | What the app does |
|---|---|
| Streak | Days since you created the tracker or last logged a slip. Worked out from your logs every time, so it can't drift. |
| Milestones and banked hours | Every `interval_days` clean days banks `allowance_hours` (default 24). A slip resets both to 0. |
| Banked hours are **not** a reward to use | The app never presents banked time as permission. It shows it as proof you don't need it. For substances it warns that tolerance drops after time away, which raises overdose risk ([NIDA](https://nida.nih.gov/publications/drugfacts/heroin)). |
| Several addictions | Each one has its own tracker. Reminders are **one** combined daily Google Calendar event. |
| Log before or after | Logs take an optional time, so a slip can be recorded later. |
| Seeing it coming | Slips and urges are grouped by weekday and time of day. When a slot repeats, the phone sends a "hard stretch coming up" notice 30 minutes before it. |
| Risky places | Optional. You mark a place; the phone alerts you when you get close. Needs "Always" location permission. Off by default. |
| AI companion | Reads your context, picks one verse **from the verses the app sends it** (so it can't misquote), suggests a chapter to pray through, and gives one practical next step. |

## Privacy: what leaves the phone

No accounts, no sign-in, no analytics. Everything is stored in SQLite on the device.

The only thing that ever leaves is an AI request, sent to **your** relay server (`/relay`) and from there to Anthropic's API. It contains: the conversation on screen, the addiction name and category, the day count, weekday/time patterns, the "about me" notes the person chose to share, and the candidate verses. It never contains a name, device ID, location, or timestamps. The relay keeps nothing and logs no message text. Chat history is not saved on the phone either; only a 20-word summary is attached to the log.

Crisis phrases are checked **on the phone** first, and help numbers are shown immediately, before the AI replies.

## Project layout

```
App.tsx                      Placeholder home screen (proves the data layer works)
index.ts                     Entry; registers the background location task
src/
  db/                        SQLite schema, migrations, seed, read/write functions
    schema.ts                The five tables
    seed/scriptures.ts       47 World English Bible verses (generated, public domain)
    repo/                    addictions, logs, profile, dangerZones, scriptures
  services/
    recovery/                Streak maths, milestone wording, risk-pattern detection
    ai/                      Crisis check, verse matching, relay client, request contract
    location/geofence.ts     Risky-place alerts
    notifications/local.ts   On-device notifications and pattern nudges
    calendar/googleCalendar.ts  "Add to Google Calendar" link, no Google sign-in
  prompts/sponsor.ts         The AI companion's instructions and answer format
  hooks/                     useAddictions, useLogs, useSponsor
  components/                StreakCard, CrisisBanner
  config/                    Crisis numbers, relay URL
relay/                       The one small server: holds the API key, forwards requests
scripts/build-scripture-seed.mjs  Rebuilds the verse list from WEB source text
test/                        Unit tests for the logic above
```

## Run it

```bash
npm install
cp .env.example .env          # set EXPO_PUBLIC_RELAY_URL
npm run typecheck
npm test
npx expo run:ios              # or run:android. Needs a development build, not Expo Go,
                              # because of background location
```

### Relay

```bash
cd relay
npm install
ANTHROPIC_API_KEY=sk-ant-... npm run dev     # http://localhost:8787
```

`relay/src/handler.ts` exports a standard `fetch` handler, so it deploys to Cloudflare Workers, Deno Deploy, Bun, Vercel or any Node host. Settings: `ANTHROPIC_API_KEY` (required), `SPONSOR_MODEL` (default `claude-opus-5`), `RATE_LIMIT_PER_MINUTE` (default 20 per IP). Never put the API key in the app: anything shipped in an app can be extracted.

## Extending it (open source)

- **Your own addiction types.** An addiction is just a name, one of three categories (`substance`, `behavioral`, `digital`), and a milestone interval. Nothing is hard-coded per addiction.
- **More verses.** Add a row to `CURATED` in `scripts/build-scripture-seed.mjs` with its emotion tags, run it against the WEB source (instructions at the top of the script), and commit the generated file. Text is always copied from the source, never typed by hand.
- **Other languages, translations or faiths.** The `scriptures` table has a `translation` column, and verse matching works only on tags.
- **Crisis numbers for your country.** Edit `src/config/crisisResources.ts`.
- **A different AI host.** The app only knows the relay's `/sponsor` contract (`src/services/ai/contract.ts`).

## Not built yet

Onboarding, the chat screen, history, settings (delete all data, export), risky-place setup screen, a watch app, and choosing a license.

Scripture: World English Bible, public domain, [ebible.org/web](https://ebible.org/web/).
