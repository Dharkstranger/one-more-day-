// One More Day relay: the only server in the system.
// Holds the Anthropic API key, forwards one sponsor turn, returns the reply.
// Stores nothing. Logs no message content. No accounts.
//
// Used by api/sponsor.ts (Vercel) and server/node-server.ts (any Node host).
// The handler takes a standard Web Request, so it also runs on Cloudflare,
// Deno, or Bun with a one-line wrapper. See docs/self-hosting.md.
import Anthropic from '@anthropic-ai/sdk';
import { SPONSOR_OUTPUT_SCHEMA, SPONSOR_SYSTEM_PROMPT } from '../src/prompts/sponsor';
import { renderContext, validateSponsorRequest, type SponsorRequest, type SponsorResponse } from '../src/services/ai/contract';

const MODEL = process.env.SPONSOR_MODEL || 'claude-opus-5';
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE || 20);

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!process.env.ANTHROPIC_API_KEY) return null;
  client ??= new Anthropic();
  return client;
}

// Best-effort, in-memory, per-instance. Entries expire after a minute; nothing is written anywhere.
const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + 60_000 });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_PER_MINUTE;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

export async function askClaude(anthropic: Anthropic, request: SponsorRequest): Promise<SponsorResponse> {
  // Context goes at the start of the newest user turn so the system prompt
  // stays byte-identical across requests and can be cached.
  const turns = request.messages.map((m) => ({ role: m.role, content: m.content }));
  const last = turns[turns.length - 1];
  last.content = `${renderContext(request.mode, request.context)}\n\n${last.content}`;

  const response = await anthropic.beta.messages.create({
    model: MODEL,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: SPONSOR_OUTPUT_SCHEMA as unknown as Record<string, unknown> },
    },
    system: [{ type: 'text', text: SPONSOR_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: turns,
  });

  if (response.stop_reason === 'refusal') throw new Error('refusal');
  const text = response.content.flatMap((b) => (b.type === 'text' ? [b.text] : [])).join('');
  const parsed = JSON.parse(text) as SponsorResponse;

  // Only allow a verse the app actually sent, so a misquote can never reach the person.
  const verseIds = new Set(request.context.candidateVerses.map((v) => v.id));
  if (parsed.verse_id && !verseIds.has(parsed.verse_id)) parsed.verse_id = null;
  return parsed;
}

/** POST body: SponsorRequest. Returns SponsorResponse. Contract: docs/api.md */
export async function handleSponsorRequest(req: Request): Promise<Response> {
  if (req.method !== 'POST') return json(405, { error: 'use POST' });

  const anthropic = getClient();
  if (!anthropic) return json(503, { error: 'sponsor not configured on this server' });

  const ip = req.headers.get('x-real-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (rateLimited(ip)) return json(429, { error: 'slow down' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid json' });
  }
  const invalid = validateSponsorRequest(body);
  if (invalid) return json(400, { error: invalid });

  try {
    return json(200, await askClaude(anthropic, body as SponsorRequest));
  } catch (e) {
    // Log the error type only, never the request body.
    if (e instanceof Anthropic.RateLimitError) return json(503, { error: 'busy, try again shortly' });
    if (e instanceof Anthropic.APIError) {
      console.error('anthropic error', e.status);
      return json(502, { error: 'upstream error' });
    }
    console.error('relay error', e instanceof Error ? e.name : 'unknown');
    return json(502, { error: 'could not get a reply' });
  }
}

export function handleHealth(): Response {
  return json(200, { ok: true, sponsor: Boolean(process.env.ANTHROPIC_API_KEY), model: MODEL });
}
