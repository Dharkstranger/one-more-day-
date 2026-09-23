// Web build: scheduled notifications aren't available in browsers, so this
// uses the browser Notification API for "now" alerts and skips scheduling.
// The daily reminder on web is the Google Calendar event instead.
import type { SQLiteDatabase } from 'expo-sqlite';
import type { RiskWindow } from '../recovery/riskWindows';

export const SCHEDULED_NOTIFICATIONS_SUPPORTED = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof Notification === 'undefined') return false;
  if (Notification.permission === 'granted') return true;
  return (await Notification.requestPermission()) === 'granted';
}

export async function notifyNow(title: string, body: string, _data?: Record<string, unknown>): Promise<string> {
  if (typeof Notification !== 'undefined' && Notification.permission === 'granted') new Notification(title, { body });
  return '';
}

export async function scheduleRiskNudges(_db: SQLiteDatabase, _windows: RiskWindow[]): Promise<void> {}
