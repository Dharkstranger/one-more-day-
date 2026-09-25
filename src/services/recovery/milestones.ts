import type { AddictionCategory } from '../../db/types';
import type { Progress } from './progress';

export interface MilestoneMessage {
  title: string;
  body: string;
  /** Shown under the message when present. Never hidden. */
  safetyNote?: string;
}

// Source for the tolerance warning: NIDA, https://nida.nih.gov/publications/drugfacts/heroin
// ("...risk of overdose ... if they return to drug use after a period of abstinence").
const TOLERANCE_NOTE =
  'After time away, your body handles far less than it used to. Using the old amount now is how many overdoses happen. ' +
  'If you are thinking about using, talk to someone first. US: call or text 988, or SAMHSA 1-800-662-4357.';

/**
 * Earned break time is framed as proof of strength, never as permission.
 * The app never presents stacked hours as a window to use in.
 */
export function milestoneMessage(name: string, category: AddictionCategory, p: Progress): MilestoneMessage {
  if (p.streakDays === 0) {
    return {
      title: 'Day 0 is still a day in the fight',
      body: `You are here and you are still counting. That matters. Let's get through today without ${name}. Just one more day.`,
    };
  }

  if (p.cyclesCompleted === 0) {
    return {
      title: `${p.streakDays} day${p.streakDays === 1 ? '' : 's'} free`,
      body: `${p.daysUntilNextCycle} more day${p.daysUntilNextCycle === 1 ? '' : 's'} to your next milestone. Stay with it: one more day.`,
    };
  }

  const body =
    `You have ${p.stackedHours} hours banked, and you've gone ${p.streakDays} days without ${name}. ` +
    `That's proof you don't need it. The longer you go, the more your body and mind settle into life without it. ` +
    `Those hours are a record of your strength, not a plan. Keep them banked and keep going.`;

  return {
    title: `${p.cyclesCompleted} milestone${p.cyclesCompleted === 1 ? '' : 's'} reached`,
    body,
    safetyNote: category === 'substance' ? TOLERANCE_NOTE : undefined,
  };
}
