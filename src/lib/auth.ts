/**
 * Authentication helpers.
 *
 * API Key auth:   POST / PATCH / DELETE routes check Authorization: Bearer <AGENT_API_KEY>
 * Session auth:   Browser pages use a cookie-based password session.
 *                 Disabled in local dev unless AUTH_ENABLED=true.
 */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";
const SESSION_VALUE = "authenticated";

/** Returns true when login protection is active */
export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === "true";
}

/** Verify the API key from an Authorization header */
export function verifyApiKey(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const expected = process.env.AGENT_API_KEY;
  if (!expected) return false;
  return token === expected;
}

/** Verify the browser password */
export function verifyPassword(password: string): boolean {
  const expected = process.env.LOGIN_PASSWORD ?? "12345aB!@#";
  return password === expected;
}

/** Check whether the current browser session is authenticated */
export async function isSessionValid(): Promise<boolean> {
  if (!isAuthEnabled()) return true;
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value === SESSION_VALUE;
}

/** Set the session cookie (call from a Route Handler after password is verified) */
export function buildSessionCookie(): { name: string; value: string; options: object } {
  return {
    name: SESSION_COOKIE,
    value: SESSION_VALUE,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    },
  };
}

/** Clear the session cookie */
export function buildLogoutCookie(): { name: string; value: string; options: object } {
  return {
    name: SESSION_COOKIE,
    value: "",
    options: { maxAge: 0, path: "/" },
  };
}
