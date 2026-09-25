# The user lifecycle

Who uses One More Day, what they need at each stage, and where the app meets that need. Use this when deciding what to build or change.

| Stage | What they're feeling | What they need | What the app does | Where in the code |
|---|---|---|---|---|
| **1. Curious** | "Do I even have a problem?" | No labels, no pressure | *Observe mode*: log without streaks; see times per week over 4 weeks; switch to "stop" any time | `src/app/track/new.tsx`, `TrackerCard` |
| **2. Deciding** | Hope, fear of failing | A start in under a minute, privacy | Welcome (3 screens), presets or custom name, reasons, cost. No sign-up. | `src/app/welcome.tsx`, `src/app/track/new.tsx` |
| **3. First days** | Fragile, many urges | Quick help, small wins | Milestones at 1, 3, 7 days; "I'm struggling" at the top of home; +20 rays for starting | `src/services/sunshine/rules.ts` |
| **4. Daily rhythm** | Routine forming | A reason to come back | Check-in (+10), verse of the day, sky that brightens, Google Calendar reminder | `src/app/checkin.tsx`, `src/services/calendar` |
| **5. An urge** | Pull, panic, bargaining | To get through 15 minutes | Breathing → reasons → ideas (hobbies first) → verse → sponsor → "I rode it out" (+15) | `src/app/struggle.tsx` |
| **6. A slip** | Shame, "what's the point" | No judgement, a way back | "Thank you for being honest" (+5), lifetime rays and best run shown, verse, talk it through | `src/app/slip.tsx` |
| **7. Repeated slips** | Hopeless, likely to quit the app | Smaller goals, more support | *Gentle mode* after 3 slips in 14 days: aim for the next small milestone; helplines stay visible | `trackerStats().gentleMode` |
| **8. Hard times ahead** | Unaware of patterns | A heads-up | Weekday + time patterns; phone nudges 30 min before; Journey shows them | `src/services/recovery/riskWindows.ts` |
| **9. Milestones** | Pride, temptation to "reward" themselves | Celebration that doesn't invite use | Banked break hours framed as proof of strength; overdose warning for substances | `src/services/recovery/milestones.ts` |
| **10. Stable** | Confident | Meaning, giving back | Levels up to Sunshine; (next) sending sunshine to people who are struggling | [community-design.md](community-design.md) |
| **11. New phone / leaving** | Fear of losing progress | Portability, control | Free backup file, restore, delete everything | `src/app/settings.tsx`, `src/db/repo/backup.ts` |

## Always true, at every stage

- Crisis helplines appear whenever someone is struggling, after a slip, or types words that suggest danger. The check runs on the device, before any AI call. `src/services/ai/crisis.ts`
- The app works without the AI. If the sponsor can't be reached, a written reply and a verse still appear.
- Nothing requires an account.
