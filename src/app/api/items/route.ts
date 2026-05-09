import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, ne } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, driver, getTables } from "@/lib/db";
import { verifyAgentApiKey } from "@/lib/auth";
import type { ItemType, ItemPriority, ItemStatus } from "@/lib/schema";

export const dynamic = "force-dynamic";

function currentDbTimestamp(): Date | string {
  const now = new Date();
  return driver === "postgres" ? now : now.toISOString();
}

// GET /api/items — list items with optional filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const type = searchParams.get("type") as ItemType | null;
    const status = searchParams.get("status") as ItemStatus | null;
    const assignee = searchParams.get("assignee");
    const includeDeleted = searchParams.get("includeDeleted") === "true";

    const { items } = getTables();

    // Build where conditions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [];
    if (type) conditions.push(eq(items.type as Parameters<typeof eq>[0], type));
    if (status) conditions.push(eq(items.status as Parameters<typeof eq>[0], status));
    if (!status && !includeDeleted) {
      conditions.push(ne(items.status as Parameters<typeof ne>[0], "deleted"));
    }
    if (assignee) conditions.push(eq(items.assignee as Parameters<typeof eq>[0], assignee));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any)
      .select()
      .from(items)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(items.pinned), desc(items.createdAt));

    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error("[GET /api/items]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/items — create item (requires API key)
export async function POST(req: NextRequest) {
  const auth = verifyAgentApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { type, title, content, priority, status, assignee, pinned } = body;

    if (!type || !title) {
      return NextResponse.json(
        { error: "Missing required fields: type, title" },
        { status: 400 }
      );
    }

    const { items, activityLog } = getTables();
    const id = uuidv4();
    const now = currentDbTimestamp();

    const newItem = {
      id,
      type: type as ItemType,
      title: String(title),
      content: content ? String(content) : null,
      priority: (priority ?? "normal") as ItemPriority,
      status: (status ?? "pending") as ItemStatus,
      assignee: assignee ? String(assignee) : null,
      createdBy: auth.agentName,
      createdAt: now,
      updatedAt: now,
      updatedBy: null,
      pinned: Boolean(pinned ?? false),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(items).values(newItem);

    // Log activity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(activityLog).values({
      id: uuidv4(),
      itemId: id,
      action: "created",
      detail: `Created "${title}"`,
      actor: auth.agentName,
      createdAt: now,
    });

    return NextResponse.json({ data: newItem }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/items]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
