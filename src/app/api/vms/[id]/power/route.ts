import { NextRequest, NextResponse } from "next/server";
import { setVmPower } from "@/lib/vmrest";

const VALID_ACTIONS = ["start", "stop", "pause", "resume"] as const;
type Action = (typeof VALID_ACTIONS)[number];

const ACTION_MAP: Record<Action, "on" | "off" | "pause" | "unpause"> = {
  start: "on",
  stop: "off",
  pause: "pause",
  resume: "unpause",
};

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const action: unknown = body?.action;

  if (!VALID_ACTIONS.includes(action as Action)) {
    return NextResponse.json(
      { error: `action must be one of: ${VALID_ACTIONS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    await setVmPower(id, ACTION_MAP[action as Action]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "vmrest error" },
      { status: 502 }
    );
  }
}
