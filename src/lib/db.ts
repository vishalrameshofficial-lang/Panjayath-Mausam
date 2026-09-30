import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const DB_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

const DB_PATH = path.join(DB_DIR, 'panchayat_mausam.db');

let _db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    initSchema(_db);
  }
  return _db;
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS states (
      id TEXT PRIMARY KEY,
      official_code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      localized_names TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS districts (
      id TEXT PRIMARY KEY,
      official_code TEXT UNIQUE NOT NULL,
      state_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (state_id) REFERENCES states(id)
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      official_code TEXT UNIQUE NOT NULL,
      district_id TEXT NOT NULL,
      name TEXT NOT NULL,
      centroid_lat REAL NOT NULL,
      centroid_lon REAL NOT NULL,
      elevation_m REAL NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (district_id) REFERENCES districts(id)
    );

    CREATE TABLE IF NOT EXISTS panchayats (
      id TEXT PRIMARY KEY,
      official_code TEXT UNIQUE NOT NULL,
      block_id TEXT NOT NULL,
      name TEXT NOT NULL,
      localized_names TEXT,
      centroid_lat REAL NOT NULL,
      centroid_lon REAL NOT NULL,
      elevation_m REAL NOT NULL,
      slope_deg REAL DEFAULT 0.0,
      aspect_deg REAL DEFAULT 0.0,
      distance_to_water_km REAL DEFAULT 5.0,
      land_cover TEXT DEFAULT 'Cropland',
      geometry_geojson TEXT,
      dataset_version TEXT DEFAULT 'LGD-2024-V2',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (block_id) REFERENCES blocks(id)
    );

    CREATE TABLE IF NOT EXISTS weather_sources (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      source_type TEXT NOT NULL,
      base_url TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      last_checked TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_observations (
      id TEXT PRIMARY KEY,
      panchayat_id TEXT,
      block_id TEXT,
      source_id TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      temperature REAL,
      rainfall REAL,
      humidity REAL,
      wind_speed REAL,
      wind_direction REAL,
      pressure REAL,
      quality_flag TEXT DEFAULT 'VALIDATED',
      retrieval_timestamp TEXT NOT NULL,
      raw_payload TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_forecasts (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL,
      source_id TEXT NOT NULL,
      forecast_time TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      temperature REAL,
      rainfall REAL,
      humidity REAL,
      wind_speed REAL,
      wind_direction REAL,
      pressure REAL,
      quality_flag TEXT DEFAULT 'OFFICIAL_IMD_PROCESSED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS downscaled_predictions (
      id TEXT PRIMARY KEY,
      panchayat_id TEXT NOT NULL,
      block_forecast_id TEXT,
      model_version TEXT NOT NULL,
      forecast_time TEXT NOT NULL,
      predicted_temp REAL NOT NULL,
      predicted_rain REAL NOT NULL,
      predicted_humidity REAL NOT NULL,
      predicted_wind REAL NOT NULL,
      uncertainty_lower REAL,
      uncertainty_upper REAL,
      confidence_score REAL,
      confidence_method TEXT,
      baseline_temp REAL,
      baseline_rain REAL,
      diff_temp REAL,
      diff_rain REAL,
      features_used TEXT,
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS model_versions (
      id TEXT PRIMARY KEY,
      model_name TEXT NOT NULL,
      version TEXT NOT NULL UNIQUE,
      training_dataset_version TEXT NOT NULL,
      feature_schema_version TEXT NOT NULL,
      metrics_json TEXT NOT NULL,
      feature_importance_json TEXT,
      artifact_location TEXT,
      status TEXT CHECK(status IN ('TRAINING', 'VALIDATED', 'ACTIVE', 'RETIRED', 'FAILED')) DEFAULT 'VALIDATED',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_alerts (
      id TEXT PRIMARY KEY,
      panchayat_id TEXT NOT NULL,
      severity TEXT CHECK(severity IN ('INFO', 'WATCH', 'WARNING', 'SEVERE')) DEFAULT 'INFO',
      alert_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      valid_until TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS agro_advisories (
      id TEXT PRIMARY KEY,
      panchayat_id TEXT NOT NULL,
      crop_name TEXT NOT NULL,
      growth_stage TEXT NOT NULL,
      general_advisory TEXT NOT NULL,
      irrigation_advisory TEXT NOT NULL,
      pesticide_spray_advisory TEXT NOT NULL,
      harvest_advisory TEXT NOT NULL,
      risk_level TEXT CHECK(risk_level IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')) DEFAULT 'LOW',
      generated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS weather_ingestion_logs (
      id TEXT PRIMARY KEY,
      source_id TEXT NOT NULL,
      status TEXT CHECK(status IN ('SUCCESS', 'PARTIAL', 'FAILED')) NOT NULL,
      records_ingested INTEGER DEFAULT 0,
      error_message TEXT,
      latency_ms INTEGER,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS system_users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      role TEXT CHECK(role IN ('USER', 'DATA_ANALYST', 'ADMIN', 'SUPER_ADMIN')) DEFAULT 'USER',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    -- Spatial & index optimizations
    CREATE INDEX IF NOT EXISTS idx_panchayats_block ON panchayats(block_id);
    CREATE INDEX IF NOT EXISTS idx_blocks_district ON blocks(district_id);
    CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);
    CREATE INDEX IF NOT EXISTS idx_obs_panchayat_time ON weather_observations(panchayat_id, timestamp);
    CREATE INDEX IF NOT EXISTS idx_forecast_block_time ON weather_forecasts(block_id, forecast_time);
    CREATE INDEX IF NOT EXISTS idx_downscaled_panch_time ON downscaled_predictions(panchayat_id, forecast_time);
  `);
}
