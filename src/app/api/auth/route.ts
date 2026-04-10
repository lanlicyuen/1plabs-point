import { NextRequest, NextResponse } from "next/server";
import { verifyPassword, buildSessionCookie, buildLogoutCookie } from "@/lib/auth";

// POST /api/auth/login
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    if (!verifyPassword(password)) {
      return NextResponse.json({ error: "Invalid password" }, { status: 401 });
    }
    const { name, value, options } = buildSessionCookie();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(name, value, options);
    return res;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

// POST /api/auth/logout
export async function DELETE(_req: NextRequest) {
  const { name, value, options } = buildLogoutCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(name, value, options);
  return res;
}
