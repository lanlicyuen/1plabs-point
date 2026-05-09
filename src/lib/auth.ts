/**
 * Authentication helpers.
 *
 * API Key auth:   POST / PATCH / DELETE routes check Authorization: Bearer <agent key>
 * Session auth:   Browser pages use a cookie-based password session.
 *                 Disabled in local dev unless AUTH_ENABLED=true.
 */

import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const SESSION_COOKIE = "pp_session";
const SESSION_VALUE = "authenticated";

export type AgentAuth = {
  agentName: string;
};

/** Returns true when login protection is active */
export function isAuthEnabled(): boolean {
  return process.env.AUTH_ENABLED === "true";
}

function getBearerToken(req: NextRequest): string {
  const authHeader = req.headers.get("authorization") ?? "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
}

function getConfiguredAgentKeys(): Map<string, string> {
  const agentKeys = new Map<string, string>();
  const legacyKey = process.env.AGENT_API_KEY;

  if (legacyKey) {
    agentKeys.set("yaya", legacyKey);
  }

  const namedKeys: Array<[string, string | undefined]> = [
    ["xiao_blue", process.env.POINT_AGENT_API_KEY],
    ["system", process.env.AGENT_API_KEY_SYSTEM],
    ["yaya", process.env.AGENT_API_KEY_YAYA],
    ["ashe", process.env.AGENT_API_KEY_ASHE],
    ["xiao_blue", process.env.AGENT_API_KEY_XIAO_BLUE],
  ];

  for (const [agentName, key] of namedKeys) {
    if (key) {
      agentKeys.set(agentName, key);
    }
  }

  return agentKeys;
}

/** Verify the API key from an Authorization header and return the agent identity */
export function verifyAgentApiKey(req: NextRequest): AgentAuth | null {
  const token = getBearerToken(req);
  if (!token) return null;

  for (const [agentName, key] of getConfiguredAgentKeys()) {
    if (token === key) {
      return { agentName };
    }
  }

  return null;
}

/** Verify the API key from an Authorization header */
export function verifyApiKey(req: NextRequest): boolean {
  return verifyAgentApiKey(req) !== null;
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
