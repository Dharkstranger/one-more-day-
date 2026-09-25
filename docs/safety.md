# Safety rules

These are non-negotiable. Pull requests that weaken them will not be merged.

1. **Crisis first.** Words suggesting suicide, self-harm, or overdose show helplines immediately, on the device, before any AI call (`src/services/ai/crisis.ts`). Helplines are also shown on the struggle screen and in Settings. Numbers live in `src/config/crisisResources.ts` with their sources.
2. **Never encourage use.** Banked break hours are framed as proof of strength, never as a reward. The sponsor prompt forbids approving or planning use (`src/prompts/sponsor.ts`).
3. **Tolerance warning for substances.** After time away, the old amount can cause an overdose. Source: NIDA, https://nida.nih.gov/publications/drugfacts/heroin. Shown on milestones and when creating a substance tracker.
4. **Dangerous withdrawal.** The sponsor tells people who drink heavily every day, or use benzodiazepines or opioids daily, to talk to a doctor before stopping suddenly.
5. **No misquoted scripture.** The sponsor may only use verses the app sends it, and the relay removes any verse id it didn't send. Verse text is copied from the public-domain World English Bible by script, never typed by hand.
6. **Not treatment.** The app never claims to be medical or clinical care.
7. **No shame mechanics.** No public streaks, no leaderboards, no "you failed" screens. Slips earn rays for honesty.
8. **Privacy is safety.** Addiction data can cost people jobs, custody, or relationships. See [privacy.md](privacy.md).

## Known limits

- Crisis detection is keyword-based and English-only. It will miss things. It's a safety net, not a guarantee.
- Helplines listed are mostly US. Add your country in `src/config/crisisResources.ts`.
- The AI can still be wrong. It's told to be brief, kind, and to point to real people.
