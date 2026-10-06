import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/vmrest", () => ({
  listVms: vi.fn(),
  getVmPower: vi.fn(),
  getVmIp: vi.fn(),
  setVmPower: vi.fn(),
}));

import * as vmrest from "@/lib/vmrest";

describe("GET /api/vms", () => {
  beforeEach(() => vi.clearAllMocks());

  it("VM 목록과 상태를 합쳐서 반환", async () => {
    vi.mocked(vmrest.listVms).mockResolvedValue([
      { id: "vm-1", path: "/path/kali-01.vmx" },
    ]);
    vi.mocked(vmrest.getVmPower).mockResolvedValue({ power_state: "poweredOn" });
    vi.mocked(vmrest.getVmIp).mockResolvedValue("192.168.1.10");

    const { GET } = await import("./route");
    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([
      { id: "vm-1", name: "kali-01", state: "poweredOn", ip: "192.168.1.10" },
    ]);
  });

  it("vmrest 오류 시 503 반환", async () => {
    vi.mocked(vmrest.listVms).mockRejectedValue(new Error("connection refused"));

    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(503);
  });
});

describe("POST /api/vms/[id]/power", () => {
  beforeEach(() => vi.clearAllMocks());

  it("유효한 action → 200", async () => {
    vi.mocked(vmrest.setVmPower).mockResolvedValue(undefined);

    const { POST } = await import("./[id]/power/route");
    const req = new Request("http://localhost/api/vms/vm-1/power", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start" }),
    });
    const res = await POST(req as never, {
      params: Promise.resolve({ id: "vm-1" }),
    });
    expect(res.status).toBe(200);
    expect(vmrest.setVmPower).toHaveBeenCalledWith("vm-1", "on");
  });

  it("잘못된 action → 400", async () => {
    const { POST } = await import("./[id]/power/route");
    const req = new Request("http://localhost/api/vms/vm-1/power", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "explode" }),
    });
    const res = await POST(req as never, {
      params: Promise.resolve({ id: "vm-1" }),
    });
    expect(res.status).toBe(400);
  });
});
