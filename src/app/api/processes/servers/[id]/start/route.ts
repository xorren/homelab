import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { startProcess, getStatus } from "@/lib/process-manager";

interface ServerRow {
  id: string;
  command: string;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (getStatus(id) === "running") {
    return NextResponse.json({ error: "Already running" }, { status: 409 });
  }

  const server = getDb().prepare("SELECT id, command FROM servers WHERE id = ?").get(id) as ServerRow | undefined;
  if (!server) return NextResponse.json({ error: "Server not found" }, { status: 404 });

  try {
    const pid = startProcess(id, server.command);
    return NextResponse.json({ ok: true, pid, status: "running" });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
