// Starter list shown when adding a tracker. Anyone can still type their own.
// To add one: append an entry. `category` decides safety messaging
// (substances get the tolerance/overdose warning). See docs/extending.md.
import type { AddictionCategory } from '../db/types';

export interface AddictionPreset {
  id: string;
  name: string;
  emoji: string;
  category: AddictionCategory;
  /** Suggested days between milestones for banked break time. */
  intervalDays: number;
  /** Placeholder text for "what does it cost you per week". */
  costHint: string;
}

export const PRESETS: AddictionPreset[] = [
  { id: 'alcohol', name: 'Alcohol', emoji: '🍷', category: 'substance', intervalDays: 60, costHint: 'e.g. 40' },
  { id: 'cannabis', name: 'Cannabis', emoji: '🌿', category: 'substance', intervalDays: 60, costHint: 'e.g. 30' },
  { id: 'nicotine', name: 'Smoking / vaping', emoji: '🚬', category: 'substance', intervalDays: 30, costHint: 'e.g. 50' },
  { id: 'drugs', name: 'Other drugs', emoji: '💊', category: 'substance', intervalDays: 90, costHint: 'e.g. 100' },
  { id: 'porn', name: 'Porn', emoji: '🔞', category: 'behavioral', intervalDays: 30, costHint: '0' },
  { id: 'gambling', name: 'Gambling / betting', emoji: '🎲', category: 'behavioral', intervalDays: 60, costHint: 'e.g. 100' },
  { id: 'social', name: 'Social media', emoji: '📱', category: 'digital', intervalDays: 14, costHint: '0' },
  { id: 'gaming', name: 'Gaming', emoji: '🎮', category: 'digital', intervalDays: 14, costHint: 'e.g. 10' },
  { id: 'sugar', name: 'Sugar / junk food', emoji: '🍩', category: 'behavioral', intervalDays: 14, costHint: 'e.g. 20' },
  { id: 'shopping', name: 'Shopping', emoji: '🛍️', category: 'behavioral', intervalDays: 30, costHint: 'e.g. 80' },
  { id: 'caffeine', name: 'Caffeine', emoji: '☕', category: 'substance', intervalDays: 14, costHint: 'e.g. 15' },
  { id: 'doomscroll', name: 'Late-night scrolling', emoji: '🌙', category: 'digital', intervalDays: 7, costHint: '0' },
];

export const CUSTOM_EMOJIS = ['✨', '🔥', '🌊', '⛓️', '🕳️', '🌪️', '🧩', '🎯'];
