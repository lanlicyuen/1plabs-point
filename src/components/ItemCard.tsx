import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TypeBadge, PriorityBadge, StatusBadge } from "./StatusBadge";
import type { Item } from "@/lib/schema";

interface ItemCardProps {
  item: Item;
}

function formatDate(d: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function ItemCard({ item }: ItemCardProps) {
  const isArchived = item.status === "archived";
  const isUrgent = item.priority === "urgent";

  return (
    <Card
      className={[
        "relative transition-all hover:shadow-md",
        isArchived ? "opacity-50" : "",
        isUrgent ? "border-red-300 bg-red-50/30" : "",
        item.pinned ? "ring-2 ring-yellow-400 ring-offset-1" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {item.pinned && (
        <span className="absolute -top-2 -right-2 text-yellow-500 text-sm" title="Pinned">
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
        </div>
        <h3 className="text-sm font-semibold leading-snug mt-1">{item.title}</h3>
      </CardHeader>

      {item.content && (
        <CardContent className="px-4 pb-4 pt-0">
          <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
            {item.content}
          </p>
        </CardContent>
      )}

      <div className="px-4 pb-3 flex flex-wrap items-center justify-between gap-1 text-xs text-muted-foreground">
        <div className="flex flex-col gap-0.5">
          <span>
            By <span className="font-medium text-foreground">{item.createdBy}</span>
          </span>
          {item.assignee && (
            <span>
              Assignee: <span className="font-medium text-foreground">{item.assignee}</span>
            </span>
          )}
        </div>
        <span>{formatDate(item.createdAt)}</span>
      </div>
    </Card>
  );
}
