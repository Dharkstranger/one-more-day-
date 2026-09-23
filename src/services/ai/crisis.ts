// Runs on-device before any AI call. A match shows crisis contacts immediately;
// the AI is still called so the person isn't left alone, but help comes first.
const CRISIS_PATTERNS: RegExp[] = [
  /\bkill(ing)? my ?self\b/i,
  /\bsuicid(e|al)\b/i,
  /\b(want|wanna|going) to die\b/i,
  /\bend (it all|my life)\b/i,
  /\bno reason to live\b/i,
  /\bself[- ]?harm\b/i,
  /\bhurt(ing)? my ?self\b/i,
  /\boverdos(e|ed|ing)\b/i,
  /\bod'?(ed|d|ing)\b/i,
  /\bcan'?t breathe\b/i,
];

export function detectCrisis(text: string): boolean {
  return CRISIS_PATTERNS.some((p) => p.test(text));
}
