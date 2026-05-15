"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TypeBadge, PriorityBadge, StatusBadge } from "./StatusBadge";
import type { Item } from "@/lib/schema";
import Link from "next/link";
import { useI18n } from "./LanguageProvider";

const COMPLETED_STATUSES = ["done", "completed", "archived", "closed", "resolved"] as const;

function isCompletedStatus(status: string): boolean {
  return (COMPLETED_STATUSES as readonly string[]).includes(status);
}

interface ItemCardProps {
  item: Item;
}

function formatDate(d: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type DecisionSessionMeta = {
  decisionSessionId: string;
  projectTitle?: string;
  sessionTitle?: string;
  decisionCount?: number;
  statusCounts?: Partial<Record<DecisionLifecycleStatus, number>>;
};

type DecisionLifecycleStatus = "pending" | "accepted" | "rejected" | "completed" | "archived";

const DECISION_STATUS_SUMMARY: DecisionLifecycleStatus[] = [
  "accepted",
  "rejected",
  "pending",
  "completed",
  "archived",
];

function normalizeStatusCounts(meta: DecisionSessionMeta): Record<DecisionLifecycleStatus, number> {
  const fallbackCount = typeof meta.decisionCount === "number" ? meta.decisionCount : 0;
  const normalized: Record<DecisionLifecycleStatus, number> = {
    pending: 0,
    accepted: 0,
    rejected: 0,
    completed: 0,
    archived: 0,
  };

  if (!meta.statusCounts || typeof meta.statusCounts !== "object") {
    normalized.pending = fallbackCount;
    return normalized;
  }

  for (const status of DECISION_STATUS_SUMMARY) {
    const count = meta.statusCounts[status];
    normalized[status] = typeof count === "number" && Number.isFinite(count) && count > 0 ? Math.floor(count) : 0;
  }

  return normalized;
}

function getDecisionSessionMeta(item: Item): DecisionSessionMeta | null {
  if (item.type !== "decision" || !item.content) return null;

  try {
    const parsed = JSON.parse(item.content) as Partial<DecisionSessionMeta>;
    if (typeof parsed.decisionSessionId === "string" && parsed.decisionSessionId.trim()) {
      return {
        decisionSessionId: parsed.decisionSessionId.trim(),
        projectTitle: parsed.projectTitle,
        sessionTitle: parsed.sessionTitle,
        decisionCount: parsed.decisionCount,
        statusCounts: parsed.statusCounts,
      };
    }
  } catch {
    const quoted = item.content.match(/"decisionSessionId"\s*:\s*"([^"]+)"/);
    const plain = item.content.match(/decisionSessionId\s*[:=]\s*([^\s,}]+)/);
    const decisionSessionId = quoted?.[1] ?? plain?.[1];

    if (decisionSessionId) {
      return { decisionSessionId: decisionSessionId.trim().replace(/^["']|["']$/g, "") };
    }
  }

  return null;
}

export default function ItemCard({ item }: ItemCardProps) {
  const { t } = useI18n();
  const isCompleted = isCompletedStatus(item.status);
  const isUrgent = item.priority === "urgent";
  const decisionSessionMeta = getDecisionSessionMeta(item);
  const isDecisionWithoutSessionLink = item.type === "decision" && !decisionSessionMeta;
  const decisionHref = decisionSessionMeta
    ? `/decisions?session=${encodeURIComponent(decisionSessionMeta.decisionSessionId)}`
    : null;
  const decisionStatusCounts = decisionSessionMeta ? normalizeStatusCounts(decisionSessionMeta) : null;

  const card = (
    <Card
      className={[
        "relative transition-all hover:shadow-md",
        decisionHref ? "cursor-pointer" : "",
        isCompleted ? "opacity-60" : "",
        isCompleted ? "border-dashed border-green-300 dark:border-green-700" : "",
        isUrgent ? "border-red-300 bg-red-50/30 dark:border-red-700 dark:bg-red-950/30" : "",
        item.pinned ? "ring-2 ring-yellow-400 ring-offset-1 dark:ring-yellow-500 dark:ring-offset-background" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {item.pinned && (
        <span className="absolute -top-2 -right-2 text-yellow-500 text-sm dark:text-yellow-400" title="Pinned">
          📌
        </span>
      )}
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex flex-wrap items-start gap-1 mb-1">
          <TypeBadge type={item.type} />
          {item.priority && item.priority !== "normal" && (
            <PriorityBadge priority={item.priority} />
          )}
          <StatusBadge status={item.status} />
          {isDecisionWithoutSessionLink && (
            <span className="inline-flex items-center rounded-full border border-muted-foreground/20 bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {t.board.noLocalSessionLink}
            </span>
          )}
        </div>
        <h3 className={`text-sm font-semibold leading-snug mt-1 ${isCompleted ? "line-through decoration-double decoration-muted-foreground" : ""}`}>
          {item.title}
        </h3>
      </CardHeader>

      {item.content && (
        <CardContent className="px-4 pb-4 pt-0">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
            {decisionSessionMeta
              ? [
                  decisionSessionMeta.projectTitle,
                  decisionSessionMeta.sessionTitle,
                  ...DECISION_STATUS_SUMMARY.map((status) => `${t.status[status]}: ${decisionStatusCounts?.[status] ?? 0}`),
                ]
                  .filter(Boolean)
                  .join("\n")
              : item.content}
          </p>
        </CardContent>
      )}

      <div className="px-4 pb-3 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <span>
            {t.board.by} <span className="font-medium text-foreground">{item.createdBy}</span>
          </span>
          {item.assignee && (
            <span>
              {t.board.assignee}: <span className="font-medium text-foreground">{item.assignee}</span>
            </span>
          )}
        </div>
        <span>{formatDate(item.createdAt)}</span>
      </div>
    </Card>
  );

  if (!decisionHref) return card;

  return (
    <Link href={decisionHref} className="block rounded-lg focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      {card}
    </Link>
  );
}
