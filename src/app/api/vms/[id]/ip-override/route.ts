import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const row = getDb()
    .prepare("SELECT ip FROM vm_overrides WHERE vm_id = ?")
    .get(id) as { ip: string } | undefined;
  return NextResponse.json({ ip: row?.ip ?? null });
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const { ip } = await req.json() as { ip: string | null };
  const db = getDb();

  if (!ip || ip.trim() === "") {
    db.prepare("DELETE FROM vm_overrides WHERE vm_id = ?").run(id);
    return NextResponse.json({ ok: true, ip: null });
  }

  db.prepare(
    "INSERT OR REPLACE INTO vm_overrides (vm_id, ip) VALUES (?, ?)"
  ).run(id, ip.trim());

  return NextResponse.json({ ok: true, ip: ip.trim() });
}
