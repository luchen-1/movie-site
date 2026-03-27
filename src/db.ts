import fs from "node:fs";

import Database from "better-sqlite3";

import { config } from "./config.js";

fs.mkdirSync(config.dataDir, { recursive: true });

export const db = new Database(config.dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS movies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    external_id TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    cover_url TEXT NOT NULL,
    douban_url TEXT NOT NULL,
    ticket_url TEXT,
    douban_rating REAL,
    douban_votes INTEGER,
    release_date TEXT,
    duration TEXT,
    regions TEXT,
    genres TEXT,
    director TEXT,
    actors TEXT,
    synopsis TEXT,
    source_city TEXT NOT NULL,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_source_update_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    movie_id INTEGER NOT NULL,
    nickname TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
    comment TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (movie_id) REFERENCES movies(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS sync_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    finished_at TEXT,
    status TEXT NOT NULL,
    message TEXT,
    fetched_count INTEGER NOT NULL DEFAULT 0,
    upserted_count INTEGER NOT NULL DEFAULT 0,
    deactivated_count INTEGER NOT NULL DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_movies_city_active ON movies(source_city, is_active);
  CREATE INDEX IF NOT EXISTS idx_reviews_movie_id ON reviews(movie_id);
  CREATE INDEX IF NOT EXISTS idx_sync_logs_started_at ON sync_logs(started_at DESC);
`);

export function checkDatabaseHealth(): boolean {
  const row = db.prepare("SELECT 1 AS ok").get() as { ok: number } | undefined;
  return row?.ok === 1;
}

export function closeDatabase(): void {
  try {
    db.close();
  } catch {
    // Ignore duplicate close attempts in test cleanup.
  }
}
