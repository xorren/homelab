import { NextResponse } from "next/server";
import { getVmPower, getVmIp } from "@/lib/vmrest";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const [power, ip] = await Promise.all([
      getVmPower(id),
      getVmIp(id),
    ]);
    return NextResponse.json({ id, state: power.power_state, ip });
  } catch {
    return NextResponse.json({ error: "vmrest unreachable" }, { status: 503 });
  }
}
