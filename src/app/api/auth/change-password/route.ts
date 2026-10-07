import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSetting, setSetting } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { current, next } = body ?? {};

  if (typeof current !== "string" || typeof next !== "string") {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (next.length < 4) {
    return NextResponse.json({ error: "Password too short" }, { status: 400 });
  }

  const hash = getSetting("password_hash");
  if (!hash) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const valid = await bcrypt.compare(current, hash);
  if (!valid) return NextResponse.json({ error: "Wrong current password" }, { status: 401 });

  const newHash = await bcrypt.hash(next, 10);
  setSetting("password_hash", newHash);
  return NextResponse.json({ ok: true });
}
