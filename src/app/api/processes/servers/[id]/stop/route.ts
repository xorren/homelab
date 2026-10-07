import { NextRequest, NextResponse } from "next/server";
import { stopProcess, getStatus } from "@/lib/process-manager";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (getStatus(id) === "stopped") {
    return NextResponse.json({ error: "Not running" }, { status: 409 });
  }

  try {
    stopProcess(id);
    return NextResponse.json({ ok: true, status: "stopped" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
