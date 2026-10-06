import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";

describe("SQLite connection", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.pragma("journal_mode = WAL");
    db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key   TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  });

  it("reads and writes settings", () => {
    db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)").run(
      "test_key",
      "test_value"
    );
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("test_key") as { value: string } | undefined;
    expect(row?.value).toBe("test_value");
  });

  it("upserts settings", () => {
    db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
    ).run("k", "v1");
    db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
    ).run("k", "v2");
    const row = db
      .prepare("SELECT value FROM settings WHERE key = ?")
      .get("k") as { value: string } | undefined;
    expect(row?.value).toBe("v2");
  });
});
