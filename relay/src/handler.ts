// One More Day relay: the only server in the system.
// It holds the Anthropic API key, forwards a sponsor request, and returns the reply.
// It stores nothing and logs no message content. There are no accounts.
//
// Exposes a standard Web `fetch` handler, so it runs on Cloudflare Workers,
// Deno Deploy, Bun, Vercel, or Node (see node-server.ts).
import Anthropic from '@anthropic-ai/sdk';
import { SPONSOR_OUTPUT_SCHEMA, SPONSOR_SYSTEM_PROMPT } from '../../src/prompts/sponsor.ts';
import {
  renderContext,
  validateSponsorRequest,
  type SponsorRequest,
  type SponsorResponse,
} from '../../src/services/ai/contract.ts';

const MODEL = process.env.SPONSOR_MODEL ?? 'claude-opus-5';
const RATE_LIMIT_PER_MINUTE = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 20);

const client = new Anthropic(); // reads ANTHROPIC_API_KEY

// Best-effort, in-memory, per-instance. IPs are hashed-by-Map-key only and
// dropped after a minute; nothing is written anywhere.
const hits = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + 60_000 });
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt < now) hits.delete(k);
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT_PER_MINUTE;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function handleSponsor(request: SponsorRequest): Promise<SponsorResponse> {
  // Context goes at the start of the newest user turn so the system prompt
  // stays byte-identical across requests and can be cached.
  const turns = request.messages.map((m) => ({ role: m.role, content: m.content }));
  const last = turns[turns.length - 1];
  last.content = `${renderContext(request.mode, request.context)}\n\n${last.content}`;

  const response = await client.beta.messages.create({
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

  // Only let the model pick a verse we actually sent, so a misquote can't reach the person.
  const verseIds = new Set(request.context.candidateVerses.map((v) => v.id));
  if (parsed.verse_id && !verseIds.has(parsed.verse_id)) parsed.verse_id = null;
  return parsed;
}

export async function fetchHandler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  if (req.method === 'GET' && url.pathname === '/health') return json(200, { ok: true });
  if (req.method !== 'POST' || url.pathname !== '/sponsor') return json(404, { error: 'not found' });

  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
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
    return json(200, await handleSponsor(body as SponsorRequest));
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

export default { fetch: fetchHandler };
