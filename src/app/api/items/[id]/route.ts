import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, driver, getTables } from "@/lib/db";
import { verifyAgentApiKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

function currentDbTimestamp(): Date | string {
  const now = new Date();
  return driver === "postgres" ? now : now.toISOString();
}

// GET /api/items/[id]
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { items } = getTables();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rows = await (db as any).select().from(items).where(eq(items.id, id));
    if (rows.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error("[GET /api/items/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/items/[id] — update item (requires API key)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAgentApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    if (body.status === "deleted" && auth.agentName !== "ashe") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { items, activityLog } = getTables();

    // Fetch existing item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any).select().from(items).where(eq(items.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = currentDbTimestamp();
    const updatedBy = auth.agentName;
    const prevStatus = existing[0].status;

    const updates: Record<string, unknown> = { updatedAt: now, updatedBy };
    const allowed = ["type", "title", "content", "priority", "status", "assignee", "pinned"];
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).update(items).set(updates).where(eq(items.id, id));

    // Log appropriate action
    const action = "status" in body && body.status !== prevStatus ? "status_changed" : "updated";
    const detail =
      action === "status_changed"
        ? `Status changed from "${prevStatus}" to "${body.status}"`
        : `Updated fields: ${Object.keys(updates).filter((k) => k !== "updatedAt" && k !== "updatedBy").join(", ")}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(activityLog).values({
      id: uuidv4(),
      itemId: id,
      action,
      detail,
      actor: updatedBy,
      createdAt: now,
    });

    return NextResponse.json({ data: { id, ...updates } });
  } catch (err) {
    console.error("[PATCH /api/items/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/items/[id] — soft delete item (requires API key)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = verifyAgentApiKey(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (auth.agentName !== "ashe") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { id } = await params;
    const { items, activityLog } = getTables();
    const now = currentDbTimestamp();

    // Soft delete instead of hard delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any).select().from(items).where(eq(items.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .update(items)
      .set({ status: "deleted", updatedAt: now, updatedBy: auth.agentName })
      .where(eq(items.id, id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(activityLog).values({
      id: uuidv4(),
      itemId: id,
      action: "deleted",
      detail: `Soft deleted "${existing[0].title}"`,
      actor: auth.agentName,
      createdAt: now,
    });

    return NextResponse.json({ data: { id, status: "deleted" } });
  } catch (err) {
    console.error("[DELETE /api/items/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
