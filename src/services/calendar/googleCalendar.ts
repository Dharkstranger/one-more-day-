// Builds a Google Calendar "add event" link. Opening it drops the person into
// their own Google Calendar with the event pre-filled; they tap Save.
// We never sign in to Google and never see their calendar.
//
// Note: this URL format (calendar.google.com/calendar/render?action=TEMPLATE)
// is widely used but not formally documented by Google. Test after changes.

export interface ReminderOptions {
  /** Names shown in the event, e.g. ["alcohol", "social media"]. One combined event for all. */
  addictionNames: string[];
  /** How many days to repeat. Use the longest interval_days across addictions. */
  days: number;
  /** Local time of day for the check-in. */
  hour: number;
  minute: number;
  /** Deep link back into the app, e.g. from Linking.createURL('checkin'). */
  appLink: string;
  /** IANA zone like "Africa/Lagos"; defaults to the device zone. */
  timeZone?: string;
  startDate?: Date;
}

const pad = (n: number) => String(n).padStart(2, '0');

function localStamp(d: Date): string {
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

export function buildDailyCheckInUrl(o: ReminderOptions): string {
  const start = new Date(o.startDate ?? new Date());
  start.setHours(o.hour, o.minute, 0, 0);
  if (!o.startDate && start.getTime() < Date.now()) start.setDate(start.getDate() + 1);
  const end = new Date(start.getTime() + 10 * 60 * 1000);

  const what = o.addictionNames.length ? o.addictionNames.join(', ') : 'my recovery';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'One More Day: check in',
    details: `Daily check-in (${what}). Open the app and log today:\n${o.appLink}`,
    dates: `${localStamp(start)}/${localStamp(end)}`,
    ctz: o.timeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    recur: `RRULE:FREQ=DAILY;COUNT=${Math.max(1, Math.round(o.days))}`,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
