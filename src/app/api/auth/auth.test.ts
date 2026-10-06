import { describe, it, expect, beforeEach, vi } from "vitest";
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

// DB를 in-memory로 격리
vi.mock("@/lib/db", async () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  return {
    getSetting: (key: string): string | null => {
      const row = db
        .prepare("SELECT value FROM settings WHERE key = ?")
        .get(key) as { value: string } | undefined;
      return row?.value ?? null;
    },
    setSetting: (key: string, value: string): void => {
      db.prepare(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
      ).run(key, value);
    },
  };
});

// iron-session mock: 쿠키 없이 세션 동작 테스트
vi.mock("@/lib/session", () => ({
  getSession: vi.fn(async () => {
    const data: Record<string, unknown> = {};
    return {
      get authenticated() {
        return data.authenticated;
      },
      set authenticated(v: unknown) {
        data.authenticated = v;
      },
      save: vi.fn(async () => {}),
      destroy: vi.fn(),
    };
  }),
}));

// next/headers mock
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({})),
}));

describe("POST /api/auth/setup", () => {
  beforeEach(async () => {
    const { setSetting } = await import("@/lib/db");
    // 초기화: 해시 제거
    try {
      setSetting("password_hash", "");
    } catch {}
  });

  it("비밀번호가 짧으면 400 반환", async () => {
    const { POST } = await import("./setup/route");
    const req = new Request("http://localhost/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "ab" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    const { setSetting } = await import("@/lib/db");
    const hash = await bcrypt.hash("correct-password", 10);
    setSetting("password_hash", hash);
  });

  it("올바른 비밀번호 → 200", async () => {
    const { POST } = await import("./login/route");
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "correct-password" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(200);
  });

  it("틀린 비밀번호 → 401", async () => {
    const { POST } = await import("./login/route");
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: "wrong-password" }),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(401);
  });

  it("비밀번호 누락 → 400", async () => {
    const { POST } = await import("./login/route");
    const req = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req as never);
    expect(res.status).toBe(400);
  });
});
