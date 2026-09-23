// Danger-zone alerts. Off by default: it needs "Always" location permission,
// which is a big ask. Coordinates never leave the phone.
//
// Import this file from the app entry (index.ts) so the background task is
// registered before the OS delivers an event.
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { openDatabaseAsync } from 'expo-sqlite';
import { DATABASE_NAME } from '../../db/migrate';
import type { DangerZoneRow } from '../../db/types';
import { notifyNow } from '../notifications/local';

export const DANGER_ZONE_TASK = 'one-more-day.danger-zones';
/** iOS monitors at most 20 regions per app. */
export const MAX_ZONES = 20;
export const DANGER_ZONES_SUPPORTED = true;

interface GeofenceEvent {
  eventType: Location.LocationGeofencingEventType;
  region: Location.LocationRegion;
}

TaskManager.defineTask<GeofenceEvent>(DANGER_ZONE_TASK, async ({ data, error }) => {
  if (error || !data || data.eventType !== Location.LocationGeofencingEventType.Enter) return;

  const db = await openDatabaseAsync(DATABASE_NAME);
  const zone = await db.getFirstAsync<{ label: string | null; name: string | null }>(
    `SELECT dz.label, a.name FROM danger_zones dz LEFT JOIN addictions a ON a.id = dz.addiction_id WHERE dz.id = ?`,
    data.region.identifier ?? '',
  );
  const place = zone?.label ?? 'a place you marked';
  await notifyNow(
    'Pause for a second',
    `You're near ${place}. You've fought hard${zone?.name ? ` to stay off ${zone.name}` : ''}. Want to talk it through?`,
    { route: 'urge' },
  );
});

export async function requestDangerZonePermissions(): Promise<boolean> {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (!fg.granted) return false;
  const bg = await Location.requestBackgroundPermissionsAsync();
  return bg.granted;
}

/** Starts (or restarts) monitoring the given zones. Stops when the list is empty. */
export async function syncDangerZones(zones: DangerZoneRow[]): Promise<void> {
  const running = await Location.hasStartedGeofencingAsync(DANGER_ZONE_TASK);
  if (zones.length === 0) {
    if (running) await Location.stopGeofencingAsync(DANGER_ZONE_TASK);
    return;
  }
  await Location.startGeofencingAsync(
    DANGER_ZONE_TASK,
    zones.slice(0, MAX_ZONES).map((z) => ({
      identifier: z.id,
      latitude: z.latitude,
      longitude: z.longitude,
      radius: z.radius_meters,
      notifyOnEnter: true,
      notifyOnExit: false,
    })),
  );
}
