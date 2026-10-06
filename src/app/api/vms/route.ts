import { NextResponse } from "next/server";
import { listVms, getVmPower, getVmIp } from "@/lib/vmrest";

export interface VmEntry {
  id: string;
  name: string;
  state: "poweredOn" | "poweredOff" | "paused" | "suspended";
  ip: string | null;
}

export async function GET() {
  try {
    const vms = await listVms();

    const entries: VmEntry[] = await Promise.all(
      vms.map(async (vm) => {
        const name = vm.path.split(/[\\/]/).pop()?.replace(/\.vmx$/i, "") ?? vm.id;
        const [power, ip] = await Promise.all([
          getVmPower(vm.id).catch(() => ({ power_state: "poweredOff" as const })),
          getVmIp(vm.id),
        ]);
        return { id: vm.id, name, state: power.power_state, ip };
      })
    );

    return NextResponse.json(entries);
  } catch {
    return NextResponse.json({ error: "vmrest unreachable" }, { status: 503 });
  }
}
