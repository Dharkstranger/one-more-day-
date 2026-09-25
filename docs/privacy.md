# Privacy

**Short version:** no accounts, no ads, no analytics, no trackers. Your data lives on your device. The only thing that ever leaves is a conversation you choose to have with the AI sponsor.

## What stays on the device

Everything you log: trackers, slips, urges, check-ins, notes, rays, "about me" answers, risky places, and settings. On phones it's in the app's SQLite database. In browsers it's in that browser's private storage for the site. Clearing site data deletes it, so download a backup.

## What leaves, and when

Only in two cases, both to the relay and then to Anthropic.

**1. When you send a message on the Talk screen.** That request contains:

- the messages on screen in that conversation (up to 20)
- the addiction's name and category (e.g. "alcohol, substance")
- days free, banked hours, milestone interval
- day-and-time patterns (e.g. "Friday late evening: 3 slips or urges")
- "about me" answers you chose to fill in
- a handful of Bible verses the app picked

**2. When the Scripture Guide chooses a passage for you** (after a check-in, during an urge, after a slip). That request contains: the moment, your Bible language, the addiction's name and type, your feeling and what you wrote in that moment (up to 600 characters), time of day and weekday, day counts (now, before this slip, best run, slips in the last 14 days), your "faith" answer from About me, and the last 30 passages you were given. The code that builds it is `src/hooks/useScriptureGuide.ts`.

Neither request ever contains your name, email, phone number, device ID, location, exact timestamps, or older notes. The sponsor's request is built in `src/services/ai/buildContext.ts`.

## The relay

The request goes to the relay (`server/sponsor.ts`), which forwards it to Anthropic and returns the reply. The relay:

- keeps no database and writes nothing to disk
- logs only error types, never message text
- keeps an in-memory rate-limit counter per IP address for one minute

Anthropic's handling of API data is described in its own policies at https://www.anthropic.com/legal. Check them before running a public instance.

## Your controls

- **Settings → Download my backup**: everything, as a file you own.
- **Settings → Delete all my data**: removes it from this device.
- Don't want AI at all? Don't use Talk. Everything else works without it.

## For people running their own copy

If you deploy this, you are responsible for your relay. Don't add analytics or logging of request bodies. The AGPL license means that if you change the code and run it for others, you must publish your changes, so users can check what you did.
