import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { project_id, name, role, command, port } = body ?? {};

  if (!project_id || !name || !command) {
    return NextResponse.json({ error: "project_id, name, command required" }, { status: 400 });
  }

  const db = getDb();
  const project = db.prepare("SELECT id FROM projects WHERE id = ?").get(project_id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const id = randomUUID();
  db.prepare(
    "INSERT INTO servers (id, project_id, name, role, command, port, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
  ).run(id, project_id, name, role ?? "backend", command, port ?? null, Date.now());

  return NextResponse.json({ id, project_id, name, role: role ?? "backend", command, port: port ?? null, status: "stopped" });
}
