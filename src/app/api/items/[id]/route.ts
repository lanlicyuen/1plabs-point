import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, getTables } from "@/lib/db";
import { verifyApiKey } from "@/lib/auth";

export const dynamic = "force-dynamic";

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
  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { items, activityLog } = getTables();

    // Fetch existing item
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any).select().from(items).where(eq(items.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updatedBy = body.updatedBy ?? body.actor ?? "agent";
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

// DELETE /api/items/[id] — archive item (requires API key)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyApiKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const actor = req.headers.get("x-actor") ?? "agent";
    const { items, activityLog } = getTables();
    const now = new Date().toISOString();

    // Archive instead of hard delete
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existing = await (db as any).select().from(items).where(eq(items.id, id));
    if (existing.length === 0) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any)
      .update(items)
      .set({ status: "archived", updatedAt: now, updatedBy: actor })
      .where(eq(items.id, id));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(activityLog).values({
      id: uuidv4(),
      itemId: id,
      action: "archived",
      detail: `Archived "${existing[0].title}"`,
      actor,
      createdAt: now,
    });

    return NextResponse.json({ data: { id, status: "archived" } });
  } catch (err) {
    console.error("[DELETE /api/items/[id]]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
