import { Badge } from "@/components/ui/badge";
import type { ItemType, ItemPriority, ItemStatus } from "@/lib/schema";

interface StatusBadgeProps {
  type?: ItemType;
  priority?: ItemPriority;
  status?: ItemStatus;
}

const typeConfig: Record<ItemType, { label: string; variant: string }> = {
  decision: { label: "Decision", variant: "bg-purple-100 text-purple-800 border-purple-200" },
  progress: { label: "Progress", variant: "bg-blue-100 text-blue-800 border-blue-200" },
  blocker: { label: "Blocker", variant: "bg-red-100 text-red-800 border-red-200" },
  announcement: { label: "Announcement", variant: "bg-green-100 text-green-800 border-green-200" },
};

const priorityConfig: Record<ItemPriority, { label: string; variant: string }> = {
  urgent: { label: "Urgent", variant: "bg-red-500 text-white border-red-600" },
  high: { label: "High", variant: "bg-orange-100 text-orange-800 border-orange-200" },
  normal: { label: "Normal", variant: "bg-gray-100 text-gray-700 border-gray-200" },
  low: { label: "Low", variant: "bg-slate-100 text-slate-600 border-slate-200" },
};

const statusConfig: Record<ItemStatus, { label: string; variant: string }> = {
  pending: { label: "Pending", variant: "bg-yellow-100 text-yellow-800 border-yellow-200" },
  active: { label: "Active", variant: "bg-blue-100 text-blue-800 border-blue-200" },
  done: { label: "Done", variant: "bg-green-100 text-green-800 border-green-200" },
  archived: { label: "Archived", variant: "bg-gray-100 text-gray-500 border-gray-200" },
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
