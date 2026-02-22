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

    CREATE TABLE IF NOT EXISTS versions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_slug TEXT NOT NULL,
      revision INTEGER NOT NULL,
      app_metadata TEXT NOT NULL DEFAULT '{}',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(project_slug, revision)
    );

    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version_id INTEGER NOT NULL,
      dir TEXT NOT NULL,
      name TEXT NOT NULL,
      ext TEXT NOT NULL,
      mimetype TEXT NOT NULL,
      size_of_content TEXT NOT NULL,
      sha256 TEXT NOT NULL,
      image_width INTEGER,
      image_height INTEGER,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      deleted_at TEXT,
      UNIQUE(version_id, dir, name, ext)
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
