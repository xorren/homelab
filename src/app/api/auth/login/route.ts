import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSetting } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const password: unknown = body?.password;

  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }

  const hash = getSetting("password_hash");
  if (!hash) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }

  const valid = await bcrypt.compare(password, hash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }

  const session = await getSession();
  session.authenticated = true;
  await session.save();

  return NextResponse.json({ ok: true });
}
