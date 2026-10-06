import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

type Params = Promise<{ id: string }>;

export async function GET(_req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const db = getDb();
  const row = db
    .prepare("SELECT content, updated_at FROM notes WHERE vm_id = ?")
    .get(id) as { content: string; updated_at: number } | undefined;

  return NextResponse.json(
    row ?? { content: "", updated_at: null }
  );
}

export async function PUT(req: NextRequest, { params }: { params: Params }) {
  const { id } = await params;
  const { content } = await req.json() as { content: string };
  const db = getDb();
  const now = Date.now();

  if (!content || content.trim() === "") {
    db.prepare("DELETE FROM notes WHERE vm_id = ?").run(id);
    return NextResponse.json({ ok: true, updated_at: null });
  }

  db.prepare(
    "INSERT OR REPLACE INTO notes (vm_id, content, updated_at) VALUES (?, ?, ?)"
  ).run(id, content, now);

  return NextResponse.json({ ok: true, updated_at: now });
}
