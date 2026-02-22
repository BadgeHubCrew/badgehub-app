import { SQLITE_DB_PATH } from "@config";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

let sqliteDb: DatabaseSync | undefined;

function ensureParentDir(filePath: string) {
  const parent = path.dirname(filePath);
  mkdirSync(parent, { recursive: true });
}

function initSchema(db: DatabaseSync) {
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS projects (
      slug TEXT PRIMARY KEY,
      git TEXT,
      idp_user_id TEXT,
      latest_revision INTEGER,
      draft_revision INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT
    );

    CREATE TABLE IF NOT EXISTS registered_badges (
      id TEXT PRIMARY KEY,
      mac TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS project_api_token (
      project_slug TEXT PRIMARY KEY,
      key_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_used_at TEXT
    );

    CREATE TABLE IF NOT EXISTS event_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_slug TEXT NOT NULL,
      revision INTEGER NOT NULL,
      badge_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

export function getSqliteDb(): DatabaseSync {
  if (!sqliteDb) {
    ensureParentDir(SQLITE_DB_PATH);
    sqliteDb = new DatabaseSync(SQLITE_DB_PATH);
    initSchema(sqliteDb);
  }
  return sqliteDb;
}
