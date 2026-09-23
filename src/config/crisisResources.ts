// Crisis contacts shown instantly, without calling the AI.
// Sources (check before shipping in a new country):
//   988 Suicide & Crisis Lifeline (US): https://988lifeline.org
//   SAMHSA National Helpline (US): https://www.samhsa.gov/find-help/national-helpline
//   Find A Helpline (international directory): https://findahelpline.com
export interface CrisisResource {
  label: string;
  action: string;
  url: string;
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  { label: '988 Suicide & Crisis Lifeline (US)', action: 'Call or text 988', url: 'tel:988' },
  { label: 'SAMHSA National Helpline (US, free, 24/7)', action: 'Call 1-800-662-4357', url: 'tel:18006624357' },
  { label: 'Outside the US', action: 'Find a helpline near you', url: 'https://findahelpline.com' },
];
