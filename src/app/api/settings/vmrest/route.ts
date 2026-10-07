import { NextRequest, NextResponse } from "next/server";
import { getSetting, setSetting } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  return NextResponse.json({
    url: getSetting("vmrest_url") ?? "http://127.0.0.1:8697",
    username: getSetting("vmrest_user") ?? "admin",
  });
}

export async function PUT(req: NextRequest) {
  const session = await getSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { url, username, password } = body ?? {};

  if (typeof url === "string" && url) setSetting("vmrest_url", url);
  if (typeof username === "string" && username) setSetting("vmrest_user", username);
  if (typeof password === "string" && password) setSetting("vmrest_pass", password);

  return NextResponse.json({ ok: true });
}

export async function POST() {
  // vmrest 연결 테스트
  const url = getSetting("vmrest_url") ?? "http://127.0.0.1:8697";
  const user = getSetting("vmrest_user") ?? "admin";
  const pass = getSetting("vmrest_pass") ?? "";
  const auth = Buffer.from(`${user}:${pass}`).toString("base64");

  try {
    const res = await fetch(`${url}/api/vms`, {
      headers: { Authorization: `Basic ${auth}` },
      signal: AbortSignal.timeout(3000),
    });
    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) });
  }
}
