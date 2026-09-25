# Sponsor API

One endpoint. It's stateless: every request carries everything needed, and nothing is stored.

## `POST /api/sponsor`

**Request** (`SponsorRequest` in `src/services/ai/contract.ts`):

```json
{
  "mode": "urge",
  "context": {
    "addiction": { "name": "alcohol", "category": "substance" },
    "progress": { "streakDays": 12, "stackedHours": 0, "intervalDays": 60 },
    "recentPattern": ["Friday late evening: 3 slips or urges"],
    "profile": { "hobbies": "guitar" },
    "candidateVerses": [
      { "id": "web-philippians-4-13", "reference": "Philippians 4:13 (WEB)", "text": "I can do all things through Christ, who strengthens me." }
    ],
    "prayerChapters": ["Psalm 23"]
  },
  "messages": [{ "role": "user", "content": "I really want a drink" }]
}
```

| Field | Rules |
|---|---|
| `mode` | `slip`, `urge`, `checkin` or `chat` |
| `messages` | 1–20 turns, oldest first, last one from `user`, each ≤ 4000 characters |
| `context.candidateVerses` | ≤ 8. The sponsor may only quote these. |
| `context.profile` | string values, each ≤ 300 characters |

**Response** (`SponsorResponse`):

```json
{
  "reply": "Twelve days is real strength…",
  "verse_id": "web-philippians-4-13",
  "prayer_chapter": "Psalm 23",
  "summary": "Strong evening urge; suggested playing guitar and calling sister.",
  "profile_suggestions": [{ "key": "support_people", "value": "sister" }]
}
```

`verse_id` is always one of the ids you sent, or `null`. `profile_suggestions` must be confirmed by the person before the app saves them.

**Errors:** `400` bad request (message says why) · `405` not POST · `429` rate limited · `502` upstream error · `503` no API key configured, or busy. Clients should fall back to an offline reply (see `OFFLINE_REPLIES` in `src/services/ai/sponsorClient.ts`).

## `GET /api/health`

```json
{ "ok": true, "sponsor": true, "model": "claude-opus-5" }
```

## Building your own client

Anything that can send JSON can use a relay: a watch app, a Telegram bot, a church's website. Keep the privacy rules in [privacy.md](privacy.md): send no names or identifiers.
