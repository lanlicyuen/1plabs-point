import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { db, driver, getTables } from "@/lib/db";
import { isSessionValid } from "@/lib/auth";

export const dynamic = "force-dynamic";

type DecisionBoardCardRequest = {
  decisionSessionId?: string;
  projectTitle?: string;
  sessionTitle?: string;
  decisionCount?: number;
};

function currentDbTimestamp(): Date | string {
  const now = new Date();
  return driver === "postgres" ? now : now.toISOString();
}

function parseDecisionSessionId(content: string | null): string | null {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as { decisionSessionId?: unknown };
    return typeof parsed.decisionSessionId === "string" ? parsed.decisionSessionId : null;
  } catch {
    const quoted = content.match(/"decisionSessionId"\s*:\s*"([^"]+)"/);
    const plain = content.match(/decisionSessionId\s*[:=]\s*([^\s,}]+)/);
    return quoted?.[1] ?? plain?.[1] ?? null;
  }
}

export async function POST(req: NextRequest) {
  if (!(await isSessionValid())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await req.json()) as DecisionBoardCardRequest;
    const decisionSessionId = body.decisionSessionId?.trim();
    const projectTitle = body.projectTitle?.trim();
    const sessionTitle = body.sessionTitle?.trim();

    if (!decisionSessionId || !projectTitle || !sessionTitle) {
      return NextResponse.json(
        { error: "Missing required fields: decisionSessionId, projectTitle, sessionTitle" },
        { status: 400 }
      );
    }

    const { items, activityLog } = getTables();
    const now = currentDbTimestamp();
    const title = `Decision Session: ${sessionTitle}`;
    const content = JSON.stringify({
      decisionSessionId,
      projectTitle,
      sessionTitle,
      decisionCount: body.decisionCount ?? 0,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const decisionItems = await (db as any)
      .select()
      .from(items)
      .where(eq(items.type as Parameters<typeof eq>[0], "decision"));

    const existing = decisionItems.find(
      (item: { content: string | null }) => parseDecisionSessionId(item.content) === decisionSessionId
    );

    if (existing) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (db as any)
        .update(items)
        .set({
          title,
          content,
          priority: "normal",
          status: "active",
          updatedAt: now,
          updatedBy: "browser",
        })
        .where(eq(items.id as Parameters<typeof eq>[0], existing.id));

      return NextResponse.json({ data: { id: existing.id, updated: true } });
    }

    const id = uuidv4();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(items).values({
      id,
      type: "decision",
      title,
      content,
      priority: "normal",
      status: "active",
      assignee: null,
      createdBy: "browser",
      createdAt: now,
      updatedAt: now,
      updatedBy: null,
      pinned: false,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (db as any).insert(activityLog).values({
      id: uuidv4(),
      itemId: id,
      action: "created",
      detail: `Created "${title}"`,
      actor: "browser",
      createdAt: now,
    });

    return NextResponse.json({ data: { id, updated: false } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/decision-session-board-card]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
