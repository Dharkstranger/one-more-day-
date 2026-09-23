import { test } from 'node:test';
import assert from 'node:assert/strict';
import { detectCrisis } from '../src/services/ai/crisis';
import { prayerChaptersFor, tagsFor } from '../src/services/ai/scriptureTags';
import { renderContext, validateSponsorRequest, type SponsorRequest } from '../src/services/ai/contract';
import { SCRIPTURE_SEED } from '../src/db/seed/scriptures';

test('crisis detection catches clear danger phrases and not everyday talk', () => {
  assert.ok(detectCrisis('honestly I want to die'));
  assert.ok(detectCrisis('I think I overdosed'));
  assert.ok(!detectCrisis('I had a rough day at work and wanted a drink'));
});

test('tags come from the chosen emotion, the text, and whether they slipped', () => {
  const tags = tagsFor({ text: 'I felt so alone tonight', emotion: 'stressed', slipped: true });
  assert.ok(tags.includes('relapse'));
  assert.ok(tags.includes('loneliness'));
  assert.ok(tags.includes('stress'));
  assert.deepEqual(tagsFor({}), ['strength']);
  assert.ok(prayerChaptersFor(['relapse']).includes('Psalm 51'));
});

test('every tag used for matching has at least one verse in the seed', () => {
  const available = new Set(SCRIPTURE_SEED.flatMap((s) => [s.primary_emotion_tag, ...(s.secondary_tags ?? '').split(',')]));
  for (const emotion of ['stressed', 'lonely', 'bored', 'angry', 'sad', 'anxious', 'ashamed', 'tired', 'celebrating', 'craving']) {
    const tags = tagsFor({ emotion });
    assert.ok(tags.some((t) => available.has(t)), `no verse for emotion ${emotion}`);
  }
});

const valid: SponsorRequest = {
  mode: 'urge',
  context: {
    addiction: { name: 'alcohol', category: 'substance' },
    progress: { streakDays: 12, stackedHours: 0, intervalDays: 60 },
    recentPattern: [],
    profile: { hobbies: 'guitar' },
    candidateVerses: [{ id: 'v1', reference: 'Philippians 4:13 (WEB)', text: 'I can do all things through Christ, who strengthens me.' }],
    prayerChapters: ['Psalm 23'],
  },
  messages: [{ role: 'user', content: 'I really want a drink' }],
};

test('relay request validation', () => {
  assert.equal(validateSponsorRequest(valid), null);
  assert.equal(validateSponsorRequest({ ...valid, mode: 'other' }), 'invalid mode');
  assert.equal(
    validateSponsorRequest({ ...valid, messages: [{ role: 'assistant', content: 'hi' }] }),
    'last message must be from the user',
  );
  assert.equal(validateSponsorRequest({ ...valid, messages: [{ role: 'user', content: 'x'.repeat(5000) }] }), 'message too long');
});

test('context block carries verses and progress', () => {
  const block = renderContext(valid.mode, valid.context);
  assert.match(block, /days without it: 12/);
  assert.match(block, /\[v1\] Philippians 4:13/);
  assert.match(block, /hobbies: guitar/);
});
