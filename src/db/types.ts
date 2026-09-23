export type AddictionCategory = 'substance' | 'behavioral' | 'digital';
export type LogType = 'slip' | 'urging_averted' | 'urging_failed';
export type TimeOfDay = 'night' | 'morning' | 'afternoon' | 'evening' | 'late_evening';

export interface AddictionRow {
  id: string;
  name: string;
  category: AddictionCategory;
  interval_days: number;
  allowance_hours: number;
  stacked_hours: number;
  current_streak_days: number;
  created_at: string;
}

export interface LogRow {
  id: string;
  addiction_id: string;
  log_type: LogType;
  timestamp: string;
  day_of_week: number;
  time_of_day: TimeOfDay;
  trigger_emotion: string | null;
  user_note: string | null;
  ai_response_summary: string | null;
}

export interface UserProfileRow {
  key: string;
  value: string;
  collected_at: string;
}

export interface DangerZoneRow {
  id: string;
  addiction_id: string;
  label: string | null;
  latitude: number;
  longitude: number;
  radius_meters: number;
  created_at: string;
}

export interface ScriptureRow {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  translation: string;
  primary_emotion_tag: string | null;
  secondary_tags: string | null;
}

export type TrackingMode = 'quit' | 'observe';

export interface AddictionDetailsRow {
  addiction_id: string;
  emoji: string | null;
  mode: TrackingMode;
  weekly_cost: number;
  weekly_hours: number;
  /** JSON array of strings. */
  reasons: string;
}

export interface CheckinRow {
  id: string;
  /** Local date, YYYY-MM-DD. */
  day: string;
  mood: 1 | 2 | 3 | 4 | 5;
  gratitude: string | null;
  note: string | null;
  created_at: string;
}

export type RayKind =
  | 'first_step'
  | 'checkin'
  | 'urge_beaten'
  | 'honest_slip'
  | 'reflection'
  | 'milestone';

export interface RayRow {
  id: string;
  kind: RayKind;
  amount: number;
  addiction_id: string | null;
  /** Makes an award idempotent, e.g. "checkin:2026-09-23". */
  ref: string | null;
  created_at: string;
}
