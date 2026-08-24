/**
 * SQLite schema for LittleLog. Versioned via PRAGMA user_version.
 * All timestamps are ISO 8601 UTC strings.
 */
export const DB_NAME = 'littlelog.db';

export const MIGRATIONS: Record<number, string[]> = {
  1: [
    `CREATE TABLE IF NOT EXISTS babies (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      photo_uri TEXT,
      date_of_birth TEXT NOT NULL,
      sex TEXT,
      birth_weight_grams REAL,
      birth_length_cm REAL,
      created_at TEXT NOT NULL
    );`,
    `CREATE TABLE IF NOT EXISTS weight_entries (
      id TEXT PRIMARY KEY NOT NULL,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      weight_grams REAL NOT NULL,
      note TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_weight_baby_ts ON weight_entries (baby_id, timestamp DESC);`,
    `CREATE TABLE IF NOT EXISTS feeding_entries (
      id TEXT PRIMARY KEY NOT NULL,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      mode TEXT NOT NULL CHECK (mode IN ('breast','bottle')),
      side TEXT CHECK (side IN ('left','right','both')),
      duration_seconds INTEGER,
      amount_ml REAL,
      bottle_type TEXT CHECK (bottle_type IN ('breast_milk','formula','mixed')),
      note TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_feeding_baby_ts ON feeding_entries (baby_id, timestamp DESC);`,
    `CREATE TABLE IF NOT EXISTS sleep_entries (
      id TEXT PRIMARY KEY NOT NULL,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      start_time TEXT NOT NULL,
      end_time TEXT,
      type TEXT NOT NULL CHECK (type IN ('nap','night')),
      note TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_sleep_baby_start ON sleep_entries (baby_id, start_time DESC);`,
    `CREATE TABLE IF NOT EXISTS diaper_entries (
      id TEXT PRIMARY KEY NOT NULL,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      wet INTEGER NOT NULL CHECK (wet IN (0,1)),
      dirty INTEGER NOT NULL CHECK (dirty IN (0,1)),
      consistency TEXT,
      note TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_diaper_baby_ts ON diaper_entries (baby_id, timestamp DESC);`,
    `CREATE TABLE IF NOT EXISTS bath_entries (
      id TEXT PRIMARY KEY NOT NULL,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      note TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_bath_baby_ts ON bath_entries (baby_id, timestamp DESC);`,
    `CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY NOT NULL,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      dosage REAL NOT NULL,
      unit TEXT NOT NULL,
      form TEXT NOT NULL CHECK (form IN ('drops','syrup','tablet')),
      schedule_rule TEXT,
      reminder_times TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_medicines_baby ON medicines (baby_id, name);`,
    `CREATE TABLE IF NOT EXISTS medicine_dose_entries (
      id TEXT PRIMARY KEY NOT NULL,
      baby_id TEXT NOT NULL REFERENCES babies(id) ON DELETE CASCADE,
      medicine_id TEXT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
      timestamp TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT
    );`,
    `CREATE INDEX IF NOT EXISTS idx_doses_baby_ts ON medicine_dose_entries (baby_id, timestamp DESC);`,
  ],
};

export const LATEST_SCHEMA_VERSION = Math.max(...Object.keys(MIGRATIONS).map(Number));
