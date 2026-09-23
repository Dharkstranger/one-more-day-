import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDailyCheckInUrl } from '../src/services/calendar/googleCalendar';

test('builds one combined, repeating Google Calendar event', () => {
  const url = new URL(
    buildDailyCheckInUrl({
      addictionNames: ['alcohol', 'social media'],
      days: 60,
      hour: 20,
      minute: 0,
      appLink: 'onemoreday://checkin',
      timeZone: 'Africa/Lagos',
      startDate: new Date(2026, 9, 1),
    }),
  );
  assert.equal(url.hostname, 'calendar.google.com');
  assert.equal(url.searchParams.get('action'), 'TEMPLATE');
  assert.equal(url.searchParams.get('recur'), 'RRULE:FREQ=DAILY;COUNT=60');
  assert.equal(url.searchParams.get('dates'), '20261001T200000/20261001T201000');
  assert.match(url.searchParams.get('details') ?? '', /alcohol, social media/);
  assert.match(url.searchParams.get('details') ?? '', /onemoreday:\/\/checkin/);
});
