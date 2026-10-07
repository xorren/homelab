import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAllStatuses } from "@/lib/process-manager";
import { randomUUID } from "crypto";

interface ProjectRow {
  id: string;
  name: string;
  description: string;
  created_at: number;
}

interface ServerRow {
  id: string;
  project_id: string;
  name: string;
  role: string;
  command: string;
  port: number | null;
  created_at: number;
}

export async function GET() {
  const db = getDb();
  const projects = db.prepare("SELECT * FROM projects ORDER BY created_at ASC").all() as ProjectRow[];
  const servers = db.prepare("SELECT * FROM servers ORDER BY created_at ASC").all() as ServerRow[];

  const serverIds = servers.map((s) => s.id);
  const statuses = getAllStatuses(serverIds);

  const projectsWithServers = projects.map((p) => ({
    ...p,
    servers: servers
      .filter((s) => s.project_id === p.id)
      .map((s) => ({ ...s, status: statuses[s.id] ?? "stopped" })),
  }));

  return NextResponse.json(projectsWithServers);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, description } = body ?? {};

  if (typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name required" }, { status: 400 });
  }

  const db = getDb();
  const id = randomUUID();
  db.prepare(
    "INSERT INTO projects (id, name, description, created_at) VALUES (?, ?, ?, ?)"
  ).run(id, name.trim(), description ?? "", Date.now());

  return NextResponse.json({ id, name: name.trim(), description: description ?? "", servers: [] });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  getDb().prepare("DELETE FROM projects WHERE id = ?").run(id);
  return NextResponse.json({ ok: true });
}
