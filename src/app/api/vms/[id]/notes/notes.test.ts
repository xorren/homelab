import { describe, it, expect, beforeEach, vi } from "vitest";
import Database from "better-sqlite3";

// 인메모리 DB 공유 인스턴스
const testDb = new Database(":memory:");
testDb.pragma("journal_mode = WAL");
testDb.exec(`
  CREATE TABLE IF NOT EXISTS notes (
    vm_id      TEXT PRIMARY KEY,
    content    TEXT NOT NULL DEFAULT '',
    updated_at INTEGER NOT NULL
  );
`);

vi.mock("@/lib/db", () => ({
  getDb: () => testDb,
  getSetting: vi.fn(),
  setSetting: vi.fn(),
}));

function makeGetRequest(): Request {
  return new Request("http://localhost/api/vms/vm-1/notes");
}

function makePutRequest(body: unknown): Request {
  return new Request("http://localhost/api/vms/vm-1/notes", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/vms/[id]/notes", () => {
  it("노트 없으면 빈 content 반환", async () => {
    const { GET } = await import("./route");
    const res = await GET(
      makeGetRequest() as never,
      { params: Promise.resolve({ id: "vm-none" }) }
    );
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data.content).toBe("");
  });
});

describe("PUT /api/vms/[id]/notes", () => {
  beforeEach(() => {
    testDb.prepare("DELETE FROM notes").run();
  });

  it("노트 저장 후 GET으로 조회 가능", async () => {
    const { PUT, GET } = await import("./route");

    const putRes = await PUT(
      makePutRequest({ content: "XSS 테스트 메모" }) as never,
      { params: Promise.resolve({ id: "vm-1" }) }
    );
    const putData = await putRes.json();
    expect(putData.ok).toBe(true);
    expect(putData.updated_at).toBeTypeOf("number");

    const getRes = await GET(
      makeGetRequest() as never,
      { params: Promise.resolve({ id: "vm-1" }) }
    );
    const getData = await getRes.json();
    expect(getData.content).toBe("XSS 테스트 메모");
  });

  it("빈 content PUT → 노트 삭제", async () => {
    const { PUT, GET } = await import("./route");

    await PUT(
      makePutRequest({ content: "지울 메모" }) as never,
      { params: Promise.resolve({ id: "vm-2" }) }
    );
    await PUT(
      makePutRequest({ content: "" }) as never,
      { params: Promise.resolve({ id: "vm-2" }) }
    );

    const getRes = await GET(
      makeGetRequest() as never,
      { params: Promise.resolve({ id: "vm-2" }) }
    );
    const getData = await getRes.json();
    expect(getData.content).toBe("");
  });
});
