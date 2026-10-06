import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSetting, setSetting } from "@/lib/db";

export async function POST(req: NextRequest) {
  if (getSetting("password_hash")) {
    return NextResponse.json({ error: "Already configured" }, { status: 409 });
  }

  const body = await req.json().catch(() => null);
  const password: unknown = body?.password;

  if (typeof password !== "string" || password.length < 4) {
    return NextResponse.json(
      { error: "Password must be at least 4 characters" },
      { status: 400 }
    );
  }

  const hash = await bcrypt.hash(password, 12);
  setSetting("password_hash", hash);

  return NextResponse.json({ ok: true });
}
