// Request/response shape between the app and the relay.
// Pure types + validation, no React Native imports, so /relay can import it.

export type SponsorMode = 'slip' | 'urge' | 'checkin' | 'chat';

export interface SponsorTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface SponsorContext {
  addiction: { name: string; category: string } | null;
  progress: { streakDays: number; stackedHours: number; intervalDays: number } | null;
  /** e.g. "Most slips: Friday late_evening (4 times)". */
  recentPattern: string[];
  profile: Record<string, string>;
  candidateVerses: { id: string; reference: string; text: string }[];
  prayerChapters: string[];
}

export interface SponsorRequest {
  mode: SponsorMode;
  context: SponsorContext;
  /** Oldest first. The last entry is the person's new message. */
  messages: SponsorTurn[];
}

export interface SponsorResponse {
  reply: string;
  verse_id: string | null;
  prayer_chapter: string | null;
  summary: string;
  profile_suggestions: { key: string; value: string }[];
}

export const LIMITS = {
  maxMessages: 20,
  maxMessageChars: 4000,
  maxVerses: 8,
  maxProfileValueChars: 300,
} as const;

/** Returns an error string, or null if the request is acceptable. */
export function validateSponsorRequest(body: unknown): string | null {
  if (!body || typeof body !== 'object') return 'body must be an object';
  const b = body as Partial<SponsorRequest>;
  if (!['slip', 'urge', 'checkin', 'chat'].includes(b.mode as string)) return 'invalid mode';
  if (!Array.isArray(b.messages) || b.messages.length === 0) return 'messages required';
  if (b.messages.length > LIMITS.maxMessages) return 'too many messages';
  for (const m of b.messages) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return 'invalid message';
    if (m.content.length > LIMITS.maxMessageChars) return 'message too long';
  }
  if (b.messages[b.messages.length - 1].role !== 'user') return 'last message must be from the user';
  const c = b.context;
  if (!c || typeof c !== 'object') return 'context required';
  if (!Array.isArray(c.candidateVerses) || c.candidateVerses.length > LIMITS.maxVerses) return 'invalid verses';
  if (!Array.isArray(c.prayerChapters) || !Array.isArray(c.recentPattern)) return 'invalid context';
  if (!c.profile || typeof c.profile !== 'object') return 'invalid profile';
  for (const v of Object.values(c.profile)) {
    if (typeof v !== 'string' || v.length > LIMITS.maxProfileValueChars) return 'invalid profile value';
  }
  return null;
}

/** Renders the context block the sponsor prompt expects at the top of the conversation. */
export function renderContext(mode: SponsorMode, c: SponsorContext): string {
  const lines = [`<context>`, `mode: ${mode}`];
  if (c.addiction) lines.push(`addiction: ${c.addiction.name} (${c.addiction.category})`);
  if (c.progress) {
    lines.push(
      `days without it: ${c.progress.streakDays}`,
      `banked break hours: ${c.progress.stackedHours} (earned every ${c.progress.intervalDays} clean days)`,
    );
  }
  if (c.recentPattern.length) lines.push(`recent pattern:\n${c.recentPattern.map((p) => `- ${p}`).join('\n')}`);
  const profile = Object.entries(c.profile);
  if (profile.length) lines.push(`about them:\n${profile.map(([k, v]) => `- ${k}: ${v}`).join('\n')}`);
  lines.push(
    `candidate verses:\n${c.candidateVerses.map((v) => `- [${v.id}] ${v.reference}: "${v.text}"`).join('\n')}`,
    `prayer chapters: ${c.prayerChapters.join(', ')}`,
    `</context>`,
  );
  return lines.join('\n');
}
