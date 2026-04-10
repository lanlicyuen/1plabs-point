import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, getTables } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/activity — recent activity log
export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? "50");
    const { activityLog } = getTables();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any)
      .select()
      .from(activityLog)
      .orderBy(desc(activityLog.createdAt))
      .limit(Math.min(limit, 200));

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/activity]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
