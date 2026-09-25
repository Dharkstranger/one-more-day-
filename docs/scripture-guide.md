# The Scripture Guide

A separate AI agent whose one job is to find the right Bible passage for this person, at this moment, and walk them through it.

It's separate from the chat sponsor (`server/sponsor.ts`) on purpose. The sponsor is fast and conversational. The guide is slow and deliberate: it searches, reads, and chooses.

## When it runs

| Screen | Moment | What it knows |
|---|---|---|
| Slip | `slip` | Feeling, what they wrote, days clean before the slip, best run, slips in 14 days |
| I'm struggling | `urge` | The addiction, days clean, time and day |
| Check-in done | `checkin` | Mood, their gratitude line and note |

Plus, every time: the addiction and its type, their "faith" answer from About me, their Bible language, and the last 30 passages they were given (so it doesn't repeat itself).

## How it works

```
situation ──▶ Claude (claude-sonnet-5, effort medium)
                 │  search_bible(query, testament, limit)   BM25 search over 31,103 English verses
                 │  read_passage(book, chapter, from, to)   up to 40 verses of context
                 │  … several searches and reads …
                 ▼
            submit_guidance(book, chapter, verses, why, question, prayer, read_today, next_step)
                 │  checked on the server:
                 │   • the chapter and verses exist
                 │   • at most 3 verses
                 │   • the agent actually read them first
                 ▼
            verse text copied from data/bible in the person's language
```

- Code: `server/scriptureGuide.ts`. Instructions: `src/prompts/scriptureGuide.ts`. Bible access: `server/bible.ts`.
- At most 8 turns. If a submission fails a check, the agent is told why and tries again.
- **The AI never writes the verse text.** It picks a reference; the server copies the words from the Bible file. A misquote is impossible.
- The guidance (why, question, prayer, next step) is written in the person's language.

## What it's told to do

From `src/prompts/scriptureGuide.ts`, in short:
- Read the situation first, then look beyond the famous verses: Peter restored (John 21) for shame, Elijah under the broom tree (1 Kings 19) for exhaustion, Jesus in the wilderness (Matthew 4) for temptation, night psalms for loneliness at night.
- Speak to the specific addiction where the Bible does, but never to condemn.
- Grace first after a slip. Never encourage or excuse use.
- Warm, plain, short. No sermon.

## When it can't be reached

No internet, or no `ANTHROPIC_API_KEY` on the server: the card shows a verse from the set stored on the phone (47 verses, in your language where available), matched to the moment by feeling, with a chapter to read.

## Cost

Uses `claude-sonnet-5` by default ($2 per million input tokens, $10 per million output: https://www.anthropic.com/pricing). A rough estimate of 15,000 input and 1,500 output tokens per passage is about **$0.045 per passage**. That's an estimate, not a measurement. The system prompt and tools are cached, which lowers it. Change the model with the `SCRIPTURE_MODEL` environment variable.

## Test it

`test/scriptureGuide.test.ts` runs the whole loop with a scripted stand-in for the AI: search → read → submit, a refused submission, and the Hebrew New Testament fallback.
