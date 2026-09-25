# Data format

## Backup file

**Settings → Download my backup** produces a JSON file. Any app can read or write it, which lets people move between One More Day and other tools.

```json
{
  "format": "one-more-day-backup",
  "schemaVersion": 2,
  "exportedAt": "2026-09-25T20:15:00.000Z",
  "tables": {
    "addictions": [],
    "addiction_details": [],
    "logs": [],
    "checkins": [],
    "rays": [],
    "user_profile": [],
    "danger_zones": []
  }
}
```

Each table is an array of rows with the columns below. Restoring **replaces** everything on the device (scriptures are left alone). A file with a newer `schemaVersion` than the app is refused.

## Tables

### `addictions`
| Column | Type | Notes |
|---|---|---|
| id | text | UUID |
| name | text | e.g. "Alcohol" |
| category | text | `substance`, `behavioral`, `digital` |
| interval_days | integer | days per big milestone |
| allowance_hours | integer | break hours banked per milestone (default 24) |
| stacked_hours | integer | cache of banked hours (derived from logs) |
| current_streak_days | integer | cache of days free (derived from logs) |
| created_at | timestamp | ISO 8601 |

### `addiction_details` (v2)
| Column | Type | Notes |
|---|---|---|
| addiction_id | text | → addictions.id |
| emoji | text | |
| mode | text | `quit` or `observe` |
| weekly_cost | real | money per week |
| weekly_hours | real | hours per week |
| reasons | text | JSON array of strings |

### `logs`
| Column | Type | Notes |
|---|---|---|
| id | text | UUID |
| addiction_id | text | → addictions.id |
| log_type | text | `slip`, `urging_averted`, `urging_failed` |
| timestamp | timestamp | ISO 8601; can be in the past |
| day_of_week | integer | 0 = Sunday |
| time_of_day | text | `night` 0–5, `morning` 5–12, `afternoon` 12–17, `evening` 17–21, `late_evening` 21–24 |
| trigger_emotion | text | e.g. `lonely` |
| user_note | text | private |
| ai_response_summary | text | ≤ 20 words from the sponsor |

`slip` and `urging_failed` reset the streak. `urging_averted` doesn't.

### `checkins` (v2)
`id`, `day` (YYYY-MM-DD, unique), `mood` (1–5), `gratitude`, `note`, `created_at`.

### `rays` (v2)
`id`, `kind` (`first_step`, `checkin`, `urge_beaten`, `honest_slip`, `reflection`, `milestone`), `amount`, `addiction_id`, `ref` (unique, makes awards idempotent), `created_at`.

### `user_profile`
Key/value. Keys the AI may see: `hobbies`, `work`, `personality`, `faith_background`, `known_triggers`, `support_people`. Keys starting `setting.` are app settings and never sent.

### `danger_zones`
`id`, `addiction_id`, `label`, `latitude`, `longitude`, `radius_meters`, `created_at`. Phone only.

### `scriptures`
`id` (e.g. `web-philippians-4-13`), `book`, `chapter`, `verse`, `text`, `translation`, `primary_emotion_tag`, `secondary_tags` (comma-separated). Seeded from `src/db/seed/scriptures.ts`; not part of backups.
