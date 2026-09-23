// Database schema. Each entry in MIGRATIONS runs once, in order, tracked by
// SQLite's PRAGMA user_version. Never edit a shipped migration; append a new one.

export const SCHEMA_V1 = `
-- Tracked Addictions
CREATE TABLE addictions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT CHECK(category IN ('substance', 'behavioral', 'digital')),
    interval_days INTEGER NOT NULL,
    allowance_hours INTEGER DEFAULT 24,
    stacked_hours INTEGER DEFAULT 0,
    current_streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Slips and Urges
CREATE TABLE logs (
    id TEXT PRIMARY KEY,
    addiction_id TEXT,
    log_type TEXT CHECK(log_type IN ('slip', 'urging_averted', 'urging_failed')),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    day_of_week INTEGER,
    time_of_day TEXT,
    trigger_emotion TEXT,
    user_note TEXT,
    ai_response_summary TEXT,
    FOREIGN KEY (addiction_id) REFERENCES addictions(id)
);

-- Progressive Context (Anonymized)
CREATE TABLE user_profile (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Geofenced Danger Zones
CREATE TABLE danger_zones (
    id TEXT PRIMARY KEY,
    addiction_id TEXT,
    label TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radius_meters INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (addiction_id) REFERENCES addictions(id)
);

-- Local Scripture Database (Mini-RAG)
CREATE TABLE scriptures (
    id TEXT PRIMARY KEY,
    book TEXT NOT NULL,
    chapter INTEGER NOT NULL,
    verse INTEGER NOT NULL,
    text TEXT NOT NULL,
    translation TEXT DEFAULT 'WEB',
    primary_emotion_tag TEXT,
    secondary_tags TEXT
);

CREATE INDEX idx_logs_addiction_time ON logs(addiction_id, timestamp);
CREATE INDEX idx_scriptures_primary_tag ON scriptures(primary_emotion_tag);
`;

export const MIGRATIONS: string[] = [SCHEMA_V1];
