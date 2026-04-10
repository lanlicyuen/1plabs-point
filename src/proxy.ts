import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth only when enabled
  const authEnabled = process.env.AUTH_ENABLED === "true";
  if (!authEnabled) return NextResponse.next();

  // Public paths — never redirect
  const isPublic =
    pathname.startsWith("/demo") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon");

  if (isPublic) return NextResponse.next();

  // Check session cookie
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (session === "authenticated") return NextResponse.next();

  // Redirect to login
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("from", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
