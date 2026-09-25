# Sunshine: how progress works

Sunshine is the game layer. It has one rule above all others: **a slip resets a streak, never your light.**

All numbers live in [`src/services/sunshine/rules.ts`](../src/services/sunshine/rules.ts). Change them there, and the tests in `test/sunshine.test.ts` show what you changed.

## Rays of light (lifetime points)

| Action | Rays | Limit |
|---|---|---|
| First tracker created | 20 | once |
| Daily check-in | 10 | once per day |
| Beat an urge ("I rode it out") | 15 | per urge |
| Logged a slip honestly | 5 | per slip |
| Talked it through with the sponsor | 5 | once per conversation topic per day |
| Reached a milestone | 25 + 5 per 10 days (e.g. 30 days = 40) | once per milestone per streak |

Rays are stored as rows in the `rays` table and are **only ever added**. A `ref` column makes each award happen once (e.g. `checkin:2026-09-25`).

## Levels

| Level | Rays needed |
|---|---|
| Night | 0 |
| First Light | 40 |
| Dawn | 150 |
| Sunrise | 400 |
| Morning | 900 |
| Midday | 1800 |
| Sunshine | 3500 |

The whole app's sky colour follows your level. The sun climbs as you progress and never sinks.

## Weather (today only)

The sky's weather reflects today, on top of the level:

| Today | Weather |
|---|---|
| Slipped, mood stormy/rainy | Storm |
| Slipped | Rain |
| Mood 1–2, no slip | Cloudy |
| Any tracker under 3 days | Clearing |
| Otherwise | Clear |

## Milestones

The ladder starts small so everyone gets early wins: **1, 3, 7, 14, 21, 30, 45, 60, 90, 120, 180, 270, 365, 500, 730, 1000** days.

Separately, each tracker has an `interval_days` (e.g. 60). Every full interval banks `allowance_hours` (default 24) of "break time". The app never presents banked time as permission to use. See [safety.md](safety.md).

## Gentle mode

Three or more slips in 14 days switches a tracker into gentle mode: the card stops showing the big interval, points to the next small milestone, and speaks more softly. It turns off by itself when the slips stop.

## Why it's designed this way

Most competitors reset everything to zero after a relapse. Shame is a common reason people give up (see [competitive-analysis.md](competitive-analysis.md)). Here, honesty earns light, and what you've built stays visible.
