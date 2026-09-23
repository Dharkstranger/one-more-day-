// Web build: browsers can't watch locations in the background, so danger-zone
// alerts are phone-only. See geofence.native.ts for the real implementation.
import type { DangerZoneRow } from '../../db/types';

export const DANGER_ZONE_TASK = 'one-more-day.danger-zones';
export const MAX_ZONES = 20;
export const DANGER_ZONES_SUPPORTED = false;

export async function requestDangerZonePermissions(): Promise<boolean> {
  return false;
}

export async function syncDangerZones(_zones: DangerZoneRow[]): Promise<void> {}
