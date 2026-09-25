import { test } from 'node:test';
import assert from 'node:assert/strict';
import type Anthropic from '@anthropic-ai/sdk';
import { runScriptureGuide } from '../server/scriptureGuide';
import type { ScriptureRequest } from '../src/services/scripture/contract';

const request: ScriptureRequest = {
  moment: 'slip',
  language: 'fr',
  addiction: { name: 'alcool', category: 'substance' },
  situation: { emotion: 'ashamed', timeOfDay: 'late evening', streakBeforeSlip: 40, note: 'Je me sens nul.' },
  recentReferences: ['PSA 51:10'],
};

const submit = {
  book: 'JHN', chapter: 21, start_verse: 15, end_verse: 17,
  why: 'Pierre était tombé, et Jésus est venu le chercher.', question: 'Que dirais-tu à Jésus ce soir ?',
  prayer: 'Seigneur, relève-moi.', read_today_book: 'JHN', read_today_chapter: 21, next_step: 'Bois un verre d’eau et va dormir.',
};

/** A stand-in for the API that replays a fixed sequence of assistant turns. */
function fakeClient(turns: Anthropic.ContentBlock[][]) {
  const seen: Anthropic.MessageParam[][] = [];
  let i = 0;
  const client = {
    messages: {
      create: async (params: { messages: Anthropic.MessageParam[] }) => {
        seen.push(structuredClone(params.messages));
        const content = turns[Math.min(i++, turns.length - 1)];
        return { content, stop_reason: content.some((b) => b.type === 'tool_use') ? 'tool_use' : 'end_turn' };
      },
    },
  } as unknown as Anthropic;
  return { client, seen };
}

const use = (id: string, name: string, input: object) => ({ type: 'tool_use', id, name, input }) as unknown as Anthropic.ContentBlock;

test('guide searches, reads, submits; verse text comes from the French Bible file', async () => {
  const { client, seen } = fakeClient([
    [use('t1', 'search_bible', { query: 'Peter love feed my sheep', testament: 'NT', limit: 5 })],
    [use('t2', 'read_passage', { book: 'JHN', chapter: 21, start_verse: 12, end_verse: 19 })],
    [use('t3', 'submit_guidance', submit)],
  ]);
  const g = await runScriptureGuide(client, request);
  assert.equal(g.reference.display, 'Jean 21:15-17');
  assert.equal(g.textLanguage, 'fr');
  assert.match(g.text, /Simon, fils de Jonas, m'aimes-tu/);
  assert.equal(g.readToday.display, 'Jean 21');
  // The situation reached the model, including what they wrote.
  assert.match(JSON.stringify(seen[0]), /Je me sens nul/);
  // Search results were returned to the model.
  assert.match(JSON.stringify(seen[1]), /JHN 21/);
});

test('submitting a passage it never read is refused, then corrected', async () => {
  const { client, seen } = fakeClient([
    [use('t1', 'submit_guidance', submit)],
    [use('t2', 'read_passage', { book: 'JHN', chapter: 21, start_verse: 15, end_verse: 17 })],
    [use('t3', 'submit_guidance', submit)],
  ]);
  const g = await runScriptureGuide(client, request);
  assert.equal(g.reference.start, 15);
  assert.match(JSON.stringify(seen[1]), /Read this passage/);
});

test('Hebrew request for a New Testament passage falls back to English with a note', async () => {
  const { client } = fakeClient([
    [use('t1', 'read_passage', { book: 'JHN', chapter: 21, start_verse: 15, end_verse: 17 })],
    [use('t2', 'submit_guidance', submit)],
  ]);
  const g = await runScriptureGuide(client, { ...request, language: 'he' });
  assert.equal(g.textLanguage, 'en');
  assert.ok(g.fallbackNote);
  assert.match(g.text, /Simon, son of Jonah, do you love me/);
});
