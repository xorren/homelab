import { NextRequest, NextResponse } from "next/server";
import { getLogs } from "@/lib/process-manager";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return NextResponse.json({ logs: getLogs(id) });
}
