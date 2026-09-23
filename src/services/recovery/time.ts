import type { TimeOfDay } from '../../db/types';

export const DAY_MS = 24 * 60 * 60 * 1000;

/** Hour ranges for each bucket, [startHour, endHour). */
export const TIME_OF_DAY_RANGES: Record<TimeOfDay, [number, number]> = {
  night: [0, 5],
  morning: [5, 12],
  afternoon: [12, 17],
  evening: [17, 21],
  late_evening: [21, 24],
};

export function timeOfDay(date: Date): TimeOfDay {
  const h = date.getHours();
  if (h < 5) return 'night';
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  if (h < 21) return 'evening';
  return 'late_evening';
}

/** SQLite's CURRENT_TIMESTAMP is UTC "YYYY-MM-DD HH:MM:SS" with no zone marker. */
export function parseDbTimestamp(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) return new Date(value.replace(' ', 'T') + 'Z');
  return new Date(value);
}
