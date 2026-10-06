import { NextResponse } from "next/server";
import { join } from "path";
import { getSetting } from "@/lib/db";

export async function GET() {
  const cwd = process.cwd();
  const dbPath = join(cwd, ".data", "homelab.db");
  const hash = getSetting("password_hash");
  return NextResponse.json({ cwd, dbPath, hasHash: !!hash });
}
