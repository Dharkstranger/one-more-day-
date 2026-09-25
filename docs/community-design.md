# Community: "Send sunshine" (design, not built yet)

Goal: people further along can lift people who are struggling right now, without the risks of open chat.

## How it works

1. Someone presses **I'm struggling** and chooses "Let others send me sunshine".
2. The app posts an anonymous **signal**: the addiction category and name (from the preset list or "other"), and nothing else. No account, no location.
3. Anyone at level **Sunrise or above** sees "Someone is struggling with *alcohol* right now" on their home screen.
4. They tap one of ~20 pre-written messages (`SUNSHINE_NOTES` in `src/config/copingIdeas.ts`) and can attach a verse id.
5. The struggling person sees "3 people sent you sunshine" with the messages. Senders earn rays.

## Why preset messages only

Free text would bring trolling, predators, and people selling things to vulnerable users, plus a moderation team. Preset messages carry most of the warmth with none of that risk. The project owner chose this option.

## Data (server side)

| Table | Columns | Kept for |
|---|---|---|
| `signals` | id, category, preset_id, created_at | 2 hours |
| `sunshine` | id, signal_id, note_index, verse_id, created_at | 2 hours |

Signal ids are random. Each client keeps its own signal id locally to collect replies. No IP addresses are stored. Rate limits: 3 signals and 30 sends per device per day, using a random device token that is never linked to anything.

## Storage options

Supabase (Postgres, open source, self-hostable) is the preferred backend. Row-level security allows insert and read only, and a scheduled job deletes rows older than 2 hours.

## Open questions

- Should very new users (Night / First Light) be able to send? Proposal: no, to keep senders steady.
- Push notifications for senders require a push service. Web can't without accounts. Proposal: only show signals when the app is open.
