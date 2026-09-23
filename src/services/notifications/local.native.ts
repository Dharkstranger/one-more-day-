import * as Notifications from 'expo-notifications';
import type { SQLiteDatabase } from 'expo-sqlite';
import { getProfileValue, setProfileValue, SETTING_PREFIX } from '../../db/repo/profile';
import { nudgeTimeFor, type RiskWindow } from '../recovery/riskWindows';

export const SCHEDULED_NOTIFICATIONS_SUPPORTED = true;

const RISK_NUDGE_IDS_KEY = `${SETTING_PREFIX}risk_nudge_ids`;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/** Shows a local notification right away. Nothing goes through a server. */
export function notifyNow(title: string, body: string, data?: Record<string, unknown>): Promise<string> {
  return Notifications.scheduleNotificationAsync({ content: { title, body, data }, trigger: null });
}

/**
 * Replaces the weekly "heads up" nudges with ones built from the latest risk windows.
 * Runs after every log so the timing follows the person's real pattern.
 */
export async function scheduleRiskNudges(db: SQLiteDatabase, windows: RiskWindow[]): Promise<void> {
  const previous = await getProfileValue(db, RISK_NUDGE_IDS_KEY);
  for (const id of previous ? (JSON.parse(previous) as string[]) : []) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }

  const ids: string[] = [];
  for (const w of windows) {
    const t = nudgeTimeFor(w);
    ids.push(
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'A hard stretch is coming up',
          body: "This is usually a tough time for you. Let's get ahead of it. Tap to talk.",
          data: { route: 'urge' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: t.dayOfWeek + 1, // expo-notifications: 1 = Sunday
          hour: t.hour,
          minute: t.minute,
        },
      }),
    );
  }
  await setProfileValue(db, RISK_NUDGE_IDS_KEY, JSON.stringify(ids));
}
