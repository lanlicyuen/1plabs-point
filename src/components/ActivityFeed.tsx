import type { ActivityLog } from "@/lib/schema";

interface ActivityFeedProps {
  logs: ActivityLog[];
}

const actionLabels: Record<string, { label: string; icon: string; color: string }> = {
  created: { label: "Created", icon: "✨", color: "text-green-600 dark:text-green-400" },
  updated: { label: "Updated", icon: "✏️", color: "text-blue-600 dark:text-blue-400" },
  status_changed: { label: "Status changed", icon: "🔄", color: "text-yellow-600 dark:text-yellow-400" },
  archived: { label: "Archived", icon: "📦", color: "text-gray-500 dark:text-gray-400" },
};

function formatTime(d: string | Date | null): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No activity yet.
      </div>
    );
  }

  return (
    <ol className="relative border-l border-muted ml-3">
      {logs.map((log, idx) => {
        const meta = actionLabels[log.action] ?? { label: log.action, icon: "•", color: "text-gray-600 dark:text-gray-400" };
        return (
          <li key={log.id ?? idx} className="mb-6 ml-6">
            <span className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-background border text-sm">
              {meta.icon}
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-0.5">
              <span className={`text-sm font-medium ${meta.color}`}>{meta.label}</span>
              <span className="text-xs text-muted-foreground">{formatTime(log.createdAt)}</span>
            </div>
            {log.detail && (
              <p className="text-sm text-foreground mt-0.5">{log.detail}</p>
            )}
            <p className="text-xs text-muted-foreground mt-0.5">
              by <span className="font-medium">{log.actor}</span>
            </p>
          </li>
        );
      })}
    </ol>
  );
}