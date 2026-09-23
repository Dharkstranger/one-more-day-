// Maps what the person says or picks to the tags used in the scriptures table.

/** Emotions offered as one-tap choices when logging. */
export const TRIGGER_EMOTIONS = [
  'stressed', 'lonely', 'bored', 'angry', 'sad', 'anxious', 'ashamed', 'tired', 'celebrating', 'craving',
] as const;

const EMOTION_TO_TAGS: Record<string, string[]> = {
  stressed: ['stress', 'anxiety'],
  lonely: ['loneliness'],
  bored: ['boredom', 'habit'],
  angry: ['anger'],
  sad: ['grief', 'hopelessness'],
  anxious: ['anxiety', 'fear'],
  ashamed: ['shame', 'guilt'],
  tired: ['exhaustion'],
  celebrating: ['temptation', 'vigilance'],
  craving: ['craving', 'temptation'],
};

const KEYWORDS: [RegExp, string][] = [
  [/\b(stress|pressure|overwhelm)/i, 'stress'],
  [/\b(alone|lonely|nobody|isolat)/i, 'loneliness'],
  [/\b(bored|nothing to do)/i, 'boredom'],
  [/\b(angry|mad|furious|rage)/i, 'anger'],
  [/\b(sad|depress|grief|lost (my|a))/i, 'grief'],
  [/\b(anxious|worried|panic|scared|afraid)/i, 'anxiety'],
  [/\b(ashamed|shame|disgust|hate myself)/i, 'shame'],
  [/\b(guilt|sorry|let (them|everyone) down)/i, 'guilt'],
  [/\b(tired|exhausted|worn out)/i, 'exhaustion'],
  [/\b(crav|urge|tempt|want(ed)? (a|to use|to drink|to smoke))/i, 'craving'],
  [/\b(hopeless|give up|pointless)/i, 'hopelessness'],
];

export function tagsFor(opts: { text?: string; emotion?: string | null; slipped?: boolean }): string[] {
  const tags = new Set<string>();
  if (opts.slipped) tags.add('relapse');
  if (opts.emotion) for (const t of EMOTION_TO_TAGS[opts.emotion] ?? []) tags.add(t);
  if (opts.text) for (const [re, tag] of KEYWORDS) if (re.test(opts.text)) tags.add(tag);
  if (tags.size === 0) tags.add('strength');
  return [...tags];
}

/** Whole chapters to read and pray through, by tag. */
const PRAYER_CHAPTERS: Record<string, string[]> = {
  relapse: ['Psalm 51', 'Luke 15'],
  guilt: ['Psalm 51', '1 John 1'],
  shame: ['Romans 8', 'Psalm 32'],
  temptation: ['James 1', '1 Corinthians 10'],
  craving: ['Galatians 5', 'Romans 12'],
  fear: ['Psalm 91', 'Psalm 23'],
  anxiety: ['Matthew 6', 'Philippians 4'],
  stress: ['Psalm 121', 'Matthew 11'],
  loneliness: ['Psalm 139', 'Psalm 23'],
  grief: ['Psalm 34', 'Psalm 23'],
  hopelessness: ['Psalm 40', 'Lamentations 3'],
  exhaustion: ['Isaiah 40', 'Psalm 62'],
  anger: ['Ephesians 4', 'James 1'],
  boredom: ['Philippians 4', 'Colossians 3'],
  strength: ['Psalm 27', 'Philippians 4'],
};

export function prayerChaptersFor(tags: string[]): string[] {
  const out = new Set<string>();
  for (const t of tags) for (const c of PRAYER_CHAPTERS[t] ?? []) out.add(c);
  if (out.size === 0) out.add('Psalm 23');
  return [...out].slice(0, 4);
}
