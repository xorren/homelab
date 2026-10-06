const VMREST_BASE = "http://localhost:8697/api";

function authHeader(): string {
  const user = process.env.VMREST_USER ?? "admin";
  const pass = process.env.VMREST_PASS ?? "";
  return "Basic " + Buffer.from(`${user}:${pass}`).toString("base64");
}

export type VmPowerState = "poweredOn" | "poweredOff" | "paused" | "suspended";

export interface VmSummary {
  id: string;
  path: string;
}

export interface VmPower {
  power_state: VmPowerState;
}

export interface VmNic {
  index: number;
  type: string;
  vmnet: string;
  macAddress: string;
}

export interface VmIp {
  ip: string;
}

async function vmrestFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${VMREST_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/vnd.vmware.vmw.rest-v1+json",
      Accept: "application/vnd.vmware.vmw.rest-v1+json",
      ...options?.headers,
    },
  });
}

export async function listVms(): Promise<VmSummary[]> {
  const res = await vmrestFetch("/vms");
  if (!res.ok) throw new Error(`vmrest /vms → ${res.status}`);
  return res.json();
}

export async function getVmPower(id: string): Promise<VmPower> {
  const res = await vmrestFetch(`/vms/${id}/power`);
  if (!res.ok) throw new Error(`vmrest /vms/${id}/power → ${res.status}`);
  return res.json();
}

export async function setVmPower(
  id: string,
  state: "on" | "off" | "pause" | "unpause" | "suspend"
): Promise<void> {
  const res = await vmrestFetch(`/vms/${id}/power`, {
    method: "PUT",
    body: state,
  });
  if (!res.ok) throw new Error(`vmrest PUT /vms/${id}/power → ${res.status}`);
}

export async function getVmIp(id: string): Promise<string | null> {
  try {
    const res = await vmrestFetch(`/vms/${id}/ip`);
    if (!res.ok) return null;
    const data: VmIp = await res.json();
    return data.ip ?? null;
  } catch {
    return null;
  }
}
