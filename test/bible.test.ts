import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readVerses, searchBible, bookName } from '../server/bible';

test('search finds the classic temptation verse', () => {
  const hits = searchBible('temptation faithful way of escape endure', { limit: 5 });
  assert.equal(hits[0].ref, '1CO 10:13');
});

test('search can be limited to the New Testament', () => {
  const hits = searchBible('shepherd', { testament: 'NT', limit: 10 });
  assert.ok(hits.length > 0);
  assert.ok(hits.every((h) => !['PSA', 'EZK', 'ISA', 'GEN'].includes(h.ref.split(' ')[0])));
});

test('reads verses in French and Igbo', () => {
  assert.match(readVerses('fr', 'JHN', 3, 16, 16)!.verses[0].text, /Car Dieu a tant aimé le monde/);
  assert.match(readVerses('ig', 'JHN', 3, 16, 16)!.verses[0].text, /Chineke huru uwa n'anya/);
  assert.equal(bookName('fr', 'JHN'), 'Jean');
});

test('Hebrew Psalms use the English verse numbers', () => {
  // English Psalm 51:10 "Create in me a clean heart" is Hebrew 51:12.
  const r = readVerses('he', 'PSA', 51, 10, 10)!;
  assert.equal(r.lang, 'he');
  assert.match(r.verses[0].text, /לֵב טָהוֹר/);
});

test('Hebrew New Testament and unverified chapters fall back to English', () => {
  assert.equal(readVerses('he', 'JHN', 3, 16, 16)!.lang, 'en');
  assert.equal(readVerses('ig', 'GEN', 3, 1, 1)!.lang, 'en'); // Igbo source repeats chapter 1 here
});

test('rejects out-of-range references', () => {
  assert.equal(readVerses('en', 'JHN', 3, 16, 99), null);
  assert.equal(readVerses('en', 'XXX', 1, 1, 1), null);
});
