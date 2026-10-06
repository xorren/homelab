import { NextResponse } from "next/server";
import si from "systeminformation";

function toGb(bytes: number): number {
  return Math.round((bytes / 1024 ** 3) * 10) / 10;
}

export async function GET() {
  try {
    const [cpuLoad, mem, fsSize] = await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
    ]);

    const disks = fsSize
      .filter((fs) => fs.size > 0)
      .map((fs) => ({
        mount: fs.mount,
        used: toGb(fs.used),
        total: toGb(fs.size),
        unit: "GB",
      }));

    return NextResponse.json({
      cpu: { usage: Math.round(cpuLoad.currentLoad) },
      ram: {
        used: toGb(mem.active),
        total: toGb(mem.total),
        unit: "GB",
      },
      disks,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed" },
      { status: 500 }
    );
  }
}
