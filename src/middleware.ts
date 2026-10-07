import { NextRequest, NextResponse } from "next/server";
import { unsealData } from "iron-session";

const PUBLIC_PATHS = ["/login", "/setup", "/api/auth/login", "/api/auth/logout", "/api/auth/setup"];

const SESSION_PASSWORD =
  process.env.SESSION_SECRET ??
  "homelab-default-secret-change-in-production-32chars";

const COOKIE_NAME = "homelab_session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const cookieValue = req.cookies.get(COOKIE_NAME)?.value;

  if (!cookieValue) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const data = await unsealData<{ authenticated?: boolean }>(cookieValue, {
      password: SESSION_PASSWORD,
    });
    if (!data.authenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
