// The Scripture Guide agent. Separate from the chat sponsor.
// It searches and reads the Bible with tools, chooses a passage for this person
// and moment, and returns guidance. The verse text always comes from the Bible
// files; the model only chooses the reference.
import Anthropic from '@anthropic-ai/sdk';
import { SCRIPTURE_GUIDE_PROMPT } from '../src/prompts/scriptureGuide';
import {
  validateScriptureRequest,
  type ScriptureGuidance,
  type ScriptureRequest,
  type BibleLanguage,
} from '../src/services/scripture/contract';
import { BOOK_CODES, bookName, chapterCount, readVerses, searchBible, verseCount } from './bible';

const MODEL = process.env.SCRIPTURE_MODEL || 'claude-sonnet-5';
const MAX_TURNS = 8;
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE || 20);

const BOOK_ENUM = () => BOOK_CODES();

function tools(): Anthropic.Tool[] {
  const codes = BOOK_ENUM();
  return [
    {
      name: 'search_bible',
      description:
        'Keyword search over the whole Bible (World English Bible). Use themes, images, feelings, and story words. Returns up to `limit` verses as "BOOK C:V text". Call it several times with different queries.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        required: ['query', 'testament', 'limit'],
        properties: {
          query: { type: 'string', description: 'Words to search for, e.g. "fall rise again righteous seven times"' },
          testament: { type: 'string', enum: ['OT', 'NT', 'any'] },
          limit: { type: 'integer', description: '1 to 25' },
        },
      },
      strict: true,
    },
    {
      name: 'read_passage',
      description:
        'Read consecutive verses of one chapter (up to 40) in English, to understand the context around a candidate passage. You must read a passage before submitting it.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        required: ['book', 'chapter', 'start_verse', 'end_verse'],
        properties: {
          book: { type: 'string', enum: codes },
          chapter: { type: 'integer' },
          start_verse: { type: 'integer' },
          end_verse: { type: 'integer' },
        },
      },
      strict: true,
    },
    {
      name: 'submit_guidance',
      description: 'Submit your final choice and guidance. Call exactly once, at the end.',
      input_schema: {
        type: 'object',
        additionalProperties: false,
        required: ['book', 'chapter', 'start_verse', 'end_verse', 'why', 'question', 'prayer', 'read_today_book', 'read_today_chapter', 'next_step'],
        properties: {
          book: { type: 'string', enum: codes },
          chapter: { type: 'integer' },
          start_verse: { type: 'integer' },
          end_verse: { type: 'integer', description: 'At most start_verse + 2' },
          why: { type: 'string' },
          question: { type: 'string' },
          prayer: { type: 'string' },
          read_today_book: { type: 'string', enum: codes },
          read_today_chapter: { type: 'integer' },
          next_step: { type: 'string' },
        },
      },
      strict: true,
    },
  ];
}

function describeRequest(r: ScriptureRequest): string {
  const s = r.situation;
  const lines = [
    `language: ${r.language}`,
    `moment: ${r.moment}`,
    r.addiction ? `fighting: ${r.addiction.name} (${r.addiction.category})` : null,
    s.emotion ? `feeling: ${s.emotion}` : null,
    s.mood ? `mood today (1 stormy – 5 sunny): ${s.mood}` : null,
    s.timeOfDay || s.dayOfWeek ? `when: ${[s.dayOfWeek, s.timeOfDay].filter(Boolean).join(', ')}` : null,
    s.streakDays !== undefined ? `days clean now: ${s.streakDays}` : null,
    s.streakBeforeSlip !== undefined ? `days clean before this slip: ${s.streakBeforeSlip}` : null,
    s.bestRunDays ? `longest run: ${s.bestRunDays} days` : null,
    s.slipsLast14Days !== undefined ? `slips in the last 14 days: ${s.slipsLast14Days}` : null,
    s.gentleMode ? 'they are in a hard stretch (several slips recently)' : null,
    s.milestoneDay ? `milestone just reached: ${s.milestoneDay} days` : null,
    r.faithBackground ? `faith background: ${r.faithBackground}` : null,
    r.recentReferences.length ? `recently given (avoid): ${r.recentReferences.join(', ')}` : null,
    s.note ? `what they wrote: """${s.note}"""` : null,
  ];
  return `<situation>\n${lines.filter(Boolean).join('\n')}\n</situation>\n\nFind the right passage for them now.`;
}

type ToolInput = Record<string, unknown>;

function runTool(name: string, input: ToolInput, readSet: Set<string>): string {
  if (name === 'search_bible') {
    const hits = searchBible(String(input.query ?? ''), {
      testament: (input.testament as 'OT' | 'NT' | 'any') ?? 'any',
      limit: Math.max(1, Math.min(25, Number(input.limit) || 12)),
    });
    return hits.length ? hits.map((h) => `${h.ref} ${h.text}`).join('\n') : 'No matches. Try other words.';
  }
  if (name === 'read_passage') {
    const book = String(input.book);
    const chapter = Number(input.chapter);
    const max = verseCount(book, chapter);
    if (!max) return `No such chapter. ${book} has ${chapterCount(book)} chapters.`;
    const start = Math.max(1, Number(input.start_verse) || 1);
    const end = Math.min(max, Number(input.end_verse) || start, start + 39);
    const r = readVerses('en', book, chapter, start, end);
    if (!r) return `Verses out of range. ${book} ${chapter} has ${max} verses.`;
    for (let v = start; v <= end; v++) readSet.add(`${book}.${chapter}.${v}`);
    return r.verses.map((v) => `${v.n} ${v.text}`).join('\n');
  }
  return 'Unknown tool.';
}

/** Checks the final choice. Returns an error message for the model, or null if it's acceptable. */
function checkSubmission(input: ToolInput, readSet: Set<string>): string | null {
  const book = String(input.book);
  const chapter = Number(input.chapter);
  const start = Number(input.start_verse);
  const end = Number(input.end_verse);
  const max = verseCount(book, chapter);
  if (!max) return 'That chapter does not exist.';
  if (start < 1 || end < start || end > max) return `Verses out of range: ${book} ${chapter} has ${max} verses.`;
  if (end - start > 2) return 'Choose at most 3 consecutive verses.';
  for (let v = start; v <= end; v++) if (!readSet.has(`${book}.${chapter}.${v}`)) return 'Read this passage with read_passage before submitting it.';
  if (!verseCount(String(input.read_today_book), Number(input.read_today_chapter))) return 'read_today chapter does not exist.';
  for (const k of ['why', 'question', 'prayer', 'next_step']) if (!String(input[k] ?? '').trim()) return `${k} is empty.`;
  return null;
}

const FALLBACK_NOTE: Record<BibleLanguage, string> = {
  en: '',
  fr: 'Ce passage est affiché en anglais.',
  ig: 'Edere akụkụ a n’asụsụ Bekee.',
  he: 'הקטע מוצג באנגלית.',
};

export function buildGuidance(r: ScriptureRequest, input: ToolInput): ScriptureGuidance {
  const book = String(input.book);
  const chapter = Number(input.chapter);
  const start = Number(input.start_verse);
  const end = Number(input.end_verse);
  const passage = readVerses(r.language, book, chapter, start, end)!;
  const nameLang = passage.lang;
  const range = start === end ? `${start}` : `${start}-${end}`;
  const readBook = String(input.read_today_book);
  const readChapter = Number(input.read_today_chapter);
  return {
    reference: { book, chapter, start, end, display: `${bookName(nameLang, book)} ${chapter}:${range}` },
    text: passage.verses.map((v) => v.text).join(' '),
    textLanguage: passage.lang,
    fallbackNote: passage.lang !== r.language ? FALLBACK_NOTE[r.language] : undefined,
    why: String(input.why).trim(),
    question: String(input.question).trim(),
    prayer: String(input.prayer).trim(),
    readToday: { book: readBook, chapter: readChapter, display: `${bookName(r.language, readBook)} ${readChapter}` },
    nextStep: String(input.next_step).trim(),
  };
}

export async function runScriptureGuide(anthropic: Anthropic, request: ScriptureRequest): Promise<ScriptureGuidance> {
  const toolDefs = tools();
  const readSet = new Set<string>();
  const messages: Anthropic.MessageParam[] = [{ role: 'user', content: describeRequest(request) }];

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const last = turn === MAX_TURNS - 1;
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      system: [{ type: 'text', text: SCRIPTURE_GUIDE_PROMPT, cache_control: { type: 'ephemeral' } }],
      tools: toolDefs,
      messages: last
        ? [...messages, { role: 'user', content: 'This is your last turn. Call submit_guidance now with your best choice from passages you have read.' }]
        : messages,
    });

    if (response.stop_reason === 'refusal') throw new Error('refusal');
    messages.push({ role: 'assistant', content: response.content });

    const calls = response.content.filter((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
    if (calls.length === 0) {
      messages.push({ role: 'user', content: 'Please continue: search, read, then call submit_guidance.' });
      continue;
    }

    const results: Anthropic.ToolResultBlockParam[] = [];
    for (const call of calls) {
      const input = call.input as ToolInput;
      if (call.name === 'submit_guidance') {
        const problem = checkSubmission(input, readSet);
        if (!problem) return buildGuidance(request, input);
        results.push({ type: 'tool_result', tool_use_id: call.id, content: problem, is_error: true });
      } else {
        results.push({ type: 'tool_result', tool_use_id: call.id, content: runTool(call.name, input, readSet) });
      }
    }
    messages.push({ role: 'user', content: results });
  }
  throw new Error('guide did not finish');
}

// ---------- HTTP ----------

let client: Anthropic | null = null;
const hits = new Map<string, { count: number; resetAt: number }>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const e = hits.get(key);
  if (!e || e.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + 60_000 });
    return false;
  }
  e.count += 1;
  return e.count > RATE_LIMIT_PER_MINUTE;
}

/** POST body: ScriptureRequest. Returns ScriptureGuidance. Contract: docs/api.md */
export async function handleScriptureRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'use POST' });
  if (!process.env.ANTHROPIC_API_KEY) return json(503, { error: 'scripture guide not configured on this server' });
  client ??= new Anthropic();

  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) return json(429, { error: 'slow down' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }
  const invalid = validateScriptureRequest(body);
  if (invalid) return json(400, { error: invalid });

  try {
    return json(200, await runScriptureGuide(client, body as ScriptureRequest));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return json(503, { error: 'busy, try again shortly' });
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', e.status);
      return json(502, { error: 'upstream error' });
    }
    console.error('guide error', e instanceof Error ? e.message : 'unknown');
    return json(502, { error: 'could not choose a passage' });
  }
}
