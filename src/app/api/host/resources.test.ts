import { describe, it, expect, vi } from "vitest";

vi.mock("systeminformation", () => ({
  default: {
    currentLoad: vi.fn(async () => ({ currentLoad: 42.7 })),
    mem: vi.fn(async () => ({
      active: 8 * 1024 ** 3,
      total: 16 * 1024 ** 3,
    })),
    fsSize: vi.fn(async () => [
      { mount: "C:", size: 500 * 1024 ** 3, used: 200 * 1024 ** 3 },
      { mount: "D:", size: 1000 * 1024 ** 3, used: 300 * 1024 ** 3 },
    ]),
  },
}));

describe("GET /api/host/resources", () => {
  it("올바른 형태로 반환", async () => {
    const { GET } = await import("./resources/route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.cpu.usage).toBe(43);
    expect(data.ram.used).toBe(8);
    expect(data.ram.total).toBe(16);
    expect(data.ram.unit).toBe("GB");
    expect(data.disks).toHaveLength(2);
    expect(data.disks[0].mount).toBe("C:");
    expect(data.disks[0].total).toBe(500);
  });
});
