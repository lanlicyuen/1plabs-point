import type { ItemType, ItemPriority, ItemStatus } from "@/lib/schema";

interface StatusBadgeProps {
  type?: ItemType;
  priority?: ItemPriority;
  status?: ItemStatus;
}

const typeConfig: Record<ItemType, { label: string; variant: string }> = {
  task: { label: "Task", variant: "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800" },
  decision: { label: "🧠 Decision", variant: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800" },
  progress: { label: "Progress", variant: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  blocker: { label: "Blocker", variant: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  announcement: { label: "Announcement", variant: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
  upgrade: { label: "📦 Upgrade", variant: "bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800" },
  deploy: { label: "🚀 Deploy", variant: "bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800" },
  incident: { label: "⚠️ Incident", variant: "bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-800" },
};

const priorityConfig: Record<ItemPriority, { label: string; variant: string }> = {
  urgent: { label: "Urgent", variant: "bg-red-500 text-white border-red-600 dark:bg-red-700 dark:text-red-100 dark:border-red-600" },
  high: { label: "High", variant: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" },
  normal: { label: "Normal", variant: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
  low: { label: "Low", variant: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700" },
};

const COMPLETED_STATUSES = ["done", "completed", "archived", "closed", "resolved"] as const;

function isCompletedStatus(status: string): boolean {
  return (COMPLETED_STATUSES as readonly string[]).includes(status);
}

const statusConfig: Record<ItemStatus, { label: string; variant: string }> = {
  pending: { label: "Pending", variant: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800" },
  active: { label: "Active", variant: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  accepted: { label: "Accepted", variant: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800" },
  rejected: { label: "Rejected", variant: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" },
  done: { label: "Completed ✓", variant: "bg-green-600 text-white border-green-700 dark:bg-green-700 dark:text-green-50 dark:border-green-600" },
  completed: { label: "Completed", variant: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" },
  archived: { label: "Archived", variant: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700" },
  deleted: { label: "Deleted", variant: "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700" },
};

export function TypeBadge({ type }: { type: ItemType }) {
  const { label, variant } = typeConfig[type] ?? typeConfig.announcement;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variant}`}>
      {label}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: ItemPriority }) {
  const { label, variant } = priorityConfig[priority] ?? priorityConfig.normal;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variant}`}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ItemStatus }) {
  const { label, variant } = statusConfig[status] ?? statusConfig.pending;
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variant}`}>
      {label}
    </span>
  );
}

export default function StatusBadges({ type, priority, status }: StatusBadgeProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {type && <TypeBadge type={type} />}
      {priority && priority !== "normal" && <PriorityBadge priority={priority} />}
      {status && <StatusBadge status={status} />}
    </div>
  );
}
