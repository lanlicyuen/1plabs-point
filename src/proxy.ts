import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";
const PUBLIC_PWA_ASSET_PATHS = new Set([
  "/manifest.webmanifest",
  "/sw.js",
  "/favicon.ico",
]);
const PUBLIC_API_PATHS = new Set(["/api/auth"]);

function getBearerToken(request: NextRequest): string {
  const authHeader = request.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

function hasValidBearerToken(request: NextRequest): boolean {
  const token = getBearerToken(request);
  if (!token) return false;

  const configuredKeys = [
    process.env.POINT_AGENT_API_KEY,
    process.env.AGENT_API_KEY_SYSTEM,
    process.env.AGENT_API_KEY_XIAO_BLUE,
    process.env.AGENT_API_KEY_ASHE,
    process.env.AGENT_API_KEY_YAYA,
    process.env.AGENT_API_KEY,
  ];

  return configuredKeys.some((key) => key && token === key);
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth only when enabled
  const authEnabled = process.env.AUTH_ENABLED === "true";
  if (!authEnabled) return NextResponse.next();

  // Public paths — never redirect
  const isPublic =
    pathname.startsWith("/demo") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/icons/") ||
    PUBLIC_API_PATHS.has(pathname) ||
    PUBLIC_PWA_ASSET_PATHS.has(pathname);

  if (isPublic) return NextResponse.next();

  // Agent API calls authenticate with Bearer tokens at the route handler.
  if (hasValidBearerToken(request)) return NextResponse.next();

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
