import Database from "better-sqlite3";
import { mkdirSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), ".data");
const DB_PATH = join(DATA_DIR, "homelab.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  mkdirSync(DATA_DIR, { recursive: true });
  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  migrate(_db);
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS notes (
      vm_id      TEXT PRIMARY KEY,
      content    TEXT NOT NULL DEFAULT '',
      updated_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS vm_overrides (
      vm_id TEXT PRIMARY KEY,
      ip    TEXT NOT NULL
    );
  `);
}

export function getSetting(key: string): string | null {
  const db = getDb();
  const row = db
    .prepare("SELECT value FROM settings WHERE key = ?")
    .get(key) as { value: string } | undefined;
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
    .run(key, value);
}
