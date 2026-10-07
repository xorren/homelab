import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { stopProcess, getStatus } from "@/lib/process-manager";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (getStatus(id) === "running") {
    try { stopProcess(id); } catch {}
  }
  getDb().prepare("DELETE FROM servers WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
