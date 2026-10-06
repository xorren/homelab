import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  authenticated?: boolean;
}

const SESSION_OPTIONS = {
  password:
    process.env.SESSION_SECRET ??
    "homelab-default-secret-change-in-production-32chars",
  cookieName: "homelab_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, SESSION_OPTIONS);
}
